/**
 * Created by daniel.irwin on 6/23/17.
 */
module.exports = function(opts){

    let directoryLoader = require('../lib/requireDirectory');
    let dir = opts.dir || process.cwd();

    let services = directoryLoader.requireDirSync(opts.serviceDir || `${dir}/Services`, opts.watch || opts.watchServicesDir);

    let dataServices = directoryLoader.requireDirSync(opts.dataServiceDir || `${dir}/DataServices`, opts.watch || opts.watchDataServicesDir);

    let policies = directoryLoader.requireDirSync(opts.policyDir || `${dir}/Policies`, opts.watch || opts.watchPoliciesDir);

    let envs = directoryLoader.requireDirSync(opts.environmentsDir || `${dir}/Environments`, opts.watch || opts.watchEnvironmentsDir);

    let activeEnvironment = envs[process.env.ENVIRONMENT || 'dev'];
    if(!activeEnvironment){
        process.stderr.write('error no active environment to set the active environment set the ENVIRONMENT variable\n');
    }

    let responses = directoryLoader.requireDirSync(opts.responsesDir || `${dir}/Responses`, opts.watch || opts.watchResponsesDir);

    let lambdaFunctions = directoryLoader.requireDirSync(opts.lambdaFunctionsDor || `${dir}/Functions`, opts.watch || opts.watchLambdaFunctionsDir);

    let clientBuilder = require('../lib/clientBuilder');

    let injectableDataServices = {};
    if(dataServices){

        injectableDataServices = Object.keys(dataServices).reduce((acc, v) => {
            if(Array.isArray(dataServices[v])) {
                if(!activeEnvironment[v]){
                    process.emit('error', 'environment did not include config for ' + v);
                }
                acc[v] = clientBuilder(dataServices[v]).init(activeEnvironment[v]);
            }
            else {
                acc[v] = dataServices[v];//not a client
            }
            return acc;
        }, {});

    }

    let injector = require('../lib/injector');
    let cookieParser = require('../lib/cookieParser');
    let logger = require('../lib/logger');
    let tracer = require('../lib/trace');
    let meter = require('../lib/meter');
    let pipeline = require('../lib/pipeline');
    let i18n = require('../lib/i18n');
    let docGenerator = require('../lib/docGenerator');

    let structured = require('../lib/structured');

    let mockDataProperty = opts.mockDataProperty || 'mockData';

    let routes = require(opts.routesFile || `${dir}/routes`);

    let policiesArray = Object.keys(policies).reduce((acc, v) => {acc.push(policies[v]); return acc;}, []);

    return Object.keys(lambdaFunctions).reduce( (acc, lambdaName) => {


        let middleware = policiesArray.concat(lambdaFunctions[lambdaName]);
        let useableDataServices = injectableDataServices;

        acc[lambdaName] = function(event, context, callback){

            if(event[mockDataProperty] || context[mockDataProperty]){
                useableDataServices = structured.toImplentation(event[mockDataProperty] || context[mockDataProperty]);
            }

            let instantiatedServices = Object.keys(services).reduce((acc, serviceName) => {
              if(typeof services[serviceName] === 'function'){
                  acc[serviceName] = injector(useableDataServices, services[serviceName]);
              }
              else {
                  acc[serviceName] = services[serviceName];
              }
              return acc;
            }, {});

            let injectableResponse = Object.keys(responses).reduce((acc, v) => {
                acc[v] = function(data) {
                    injector({callback: callback, data : data }, responses[v]);
                };
                return acc;
            }, {});

            let injectableMiddlware = (middleware).reduce((acc, v) => {
                acc.push(function(req, res, next) {
                    let injectables = Object.assign(Object.assign({
                        req : req,
                        res : injectableResponse,
                        next : next,
                        i18n : i18n,
                        meter : meter,
                        tracer : tracer,
                        logger : logger
                    }, useableDataServices), instantiatedServices);

                    injector(injectables, v);
                });
                return acc;
            }, []);

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