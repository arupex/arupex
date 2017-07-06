/**
 * Created by daniel.irwin on 6/23/17.
 */
module.exports = function(opts){

    let directoryLoader = require('../lib/requireDirectory');
    let injector        = require('../lib/injector');
    let cookieParser    = require('../lib/cookieParser');
    let logger          = require('../lib/logger');
    let tracer          = require('../lib/trace');
    let meter           = require('../lib/meter');
    let pipeline        = require('../lib/pipeline');
    let i18n            = require('../lib/i18n');
    let docGenerator    = require('../lib/docGenerator');
    let structured      = require('../lib/structured');
    let clientBuilder   = require('../lib/clientBuilder');

    let dir             = opts.dir || process.cwd();

    let services        = directoryLoader.requireDirSync(opts.serviceDir         || `${dir}/Services`,     opts.watch || opts.watchServicesDir);
    let dataServices    = directoryLoader.requireDirSync(opts.dataServiceDir     || `${dir}/DataServices`, opts.watch || opts.watchDataServicesDir);
    let policies        = directoryLoader.requireDirSync(opts.policyDir          || `${dir}/Policies`,     opts.watch || opts.watchPoliciesDir);
    let responses       = directoryLoader.requireDirSync(opts.responsesDir       || `${dir}/Responses`,    opts.watch || opts.watchResponsesDir);
    let lambdaFunctions = directoryLoader.requireDirSync(opts.lambdaFunctionsDor || `${dir}/Functions`,    opts.watch || opts.watchLambdaFunctionsDir);
    let envs            = directoryLoader.requireDirSync(opts.environmentsDir    || `${dir}/Environments`, opts.watch || opts.watchEnvironmentsDir);

    let activeEnvironment = envs[process.env.ENVIRONMENT || 'dev'];
    if(!activeEnvironment){
        process.stderr.write('error no active environment to set the active environment set the ENVIRONMENT variable\n');
    }

    let mockDataProperty = opts.mockDataProperty || 'mockData';

    let injectableDataServices = {};

    function calculateInjectableDataServices(nonInjectableServices) {
        if (nonInjectableServices) {
            return Object.keys(nonInjectableServices).reduce((acc, v) => {
                if (Array.isArray(nonInjectableServices[v])) {
                    if (!activeEnvironment[v]) {
                        process.emit('error', 'environment did not include config for ' + v);
                    }
                    acc[v] = clientBuilder(nonInjectableServices[v]).init(activeEnvironment[v]);
                }
                else {
                    acc[v] = nonInjectableServices[v];//not a client
                }
                return acc;
            }, {});
        }
        return {};
    };

    injectableDataServices = calculateInjectableDataServices(dataServices);

    let policiesArray = Object.keys(policies).reduce((acc, v) => {acc.push(policies[v]); return acc;}, []);

    function initServices(useableDataServices, services) {
        return Object.keys(services).reduce((acc, serviceName) => {
            if (typeof services[serviceName] === 'function') {
                acc[serviceName] = injector(useableDataServices, services[serviceName]);
            }
            else {
                acc[serviceName] = services[serviceName];
            }
            return acc;
        }, {});
    }

    function initMiddleware(middleware, injectableResponse, useableDataServices, instantiatedServices) {
        return (middleware).reduce((acc, v) => {
            acc.push(function (req, res, next) {
                let injectables = Object.assign(Object.assign({
                    req: req,
                    res: injectableResponse,
                    next: next,
                    i18n: i18n,
                    meter: meter,
                    tracer: tracer,
                    logger: logger
                }, useableDataServices), instantiatedServices);

                injector(injectables, v);
            });
            return acc;
        }, []);
    }


    function initResponses(responses, callback) {
        return Object.keys(responses).reduce((acc, v) => {
            acc[v] = function (data) {//it is assumed that responses have 1 external parameter from the user (function)
                injector({callback: callback, data: data}, responses[v]);
            };
            return acc;
        }, {});
    }


    let metricTracer    = require('../lib/metricTracer')(function meterFinish(meter){
console.log('meter', meter);
    }, function traceFinish(type, traceName, value, other, traceRoute){
console.log('trace', type, traceName, value, other, traceRoute);
    });

    return Object.keys(lambdaFunctions).reduce( (acc, lambdaName) => {

        let middleware = policiesArray.concat(lambdaFunctions[lambdaName]);
        let useableDataServices = injectableDataServices;

        acc[lambdaName] = function(event, context, callback){

            if(event[mockDataProperty] || context[mockDataProperty]){
                useableDataServices = structured.toImplentation(event[mockDataProperty] || context[mockDataProperty]);
                Object.keys(injectableDataServices).forEach((serviceName) => {
                   if(typeof injectableDataServices[serviceName].overrideable !== 'undefined' && !injectableDataServices[serviceName].overrideable){//if false but not falsey
                       useableDataServices[serviceName] = injectableDataServices[serviceName];
                   }
                });
            }

            useableDataServices = initServices({
                event: event,
                context: context,
                meter: meter,
                tracer: tracer,
                logger: logger
            }, useableDataServices);//allow dataservices to have event or context injected within

            let instantiatedServices = initServices(useableDataServices, services);
            let injectableResponse   = initResponses(responses, callback);
            let injectableMiddlware  = initMiddleware(middleware, injectableResponse, useableDataServices, instantiatedServices);

            let lambdaPipeline = pipeline({
                timeout : false
            }, injectableMiddlware);

            lambdaPipeline(context, injectableResponse, (context) => {
                injector(Object.assign({
                    err : 'timeout',
                    data : 'timed-out after 1000ms',
                    context: context,
                    logger : logger
                }), callback);
            });

        };

        return acc;
    }, {});

};