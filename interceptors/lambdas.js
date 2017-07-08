/**
 * Created by daniel.irwin on 6/23/17.
 */
module.exports = function(opts){

    const DEFAULT_WORKER_INTERVAL = 60 * 1000;//every minute

    let meter           = require('../lib/meter');

    let directoryLoader = require('../lib/requireDirectory');
    let injector        = require('../lib/injector');
    let cookieParser    = require('../lib/cookieParser');
    let logger          = require('../lib/logger');
    let tracer          = require('../lib/trace');

    let pipeline        = require('../lib/pipeline');
    let i18n            = require('../lib/i18n');

    let docGenerator    = require('../lib/docGenerator');
    let structured      = require('../lib/structured');
    let clientBuilder   = require('../lib/clientBuilder');

    let dir             = opts.dir || process.cwd();

    let routes          = require(`${dir}/routes`);

    let hooks           = directoryLoader.requireDirSync(`${dir}/Hooks`,        opts.watch);
    let services        = directoryLoader.requireDirSync(`${dir}/Services`,     opts.watch);
    let dataServices    = directoryLoader.requireDirSync(`${dir}/DataServices`, opts.watch);
    let policies        = directoryLoader.requireDirSync(`${dir}/Policies`,     opts.watch);
    let responses       = directoryLoader.requireDirSync(`${dir}/Responses`,    opts.watch);
    let lambdaFunctions = directoryLoader.requireDirSync(`${dir}/Functions`,    opts.watch);
    let envs            = directoryLoader.requireDirSync(`${dir}/Environments`, opts.watch);
    let workers         = directoryLoader.requireDirSync(`${dir}/Workers`,      opts.watch);

    let activeEnvironment = envs[process.env.ENVIRONMENT || 'dev'];
    if(!activeEnvironment){
        process.stderr.write('error no active environment to set the active environment set the ENVIRONMENT variable\n');
    }

    let mockDataProperty = opts.mockDataProperty || 'mockData';

    let injectableDataServices = {};

    let swagger = docGenerator.generateFromUrls(Object.keys(routes), routes.headers);

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
    }

    injectableDataServices = calculateInjectableDataServices(dataServices);

    let policiesArray = Object.keys(policies).reduce((acc, v) => {acc.push(policies[v]); return acc;}, []);

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
                    logger: logger,
                    swagger: swagger
                }, useableDataServices), instantiatedServices);

                injector(injectables, v);
            });
            return acc;
        }, []);
    }


    function initResponses(injectables, responses) {
        return Object.keys(responses).reduce((acc, v) => {
            acc[v] = function (data) {//it is assumed that responses have 1 external parameter from the user (function)
                injector(Object.assign( {data : data}, injectables), responses[v]);
            };
            return acc;
        }, {});
    }


    let metricTracer    = require('../lib/metricTracer')(opts.meterFnc || function meterFinish(meter){
        console.log('meter', meter);
    }, opts.traceFnc || function traceFinish(type, traceName, value, other, traceRoute){
        console.log('trace', type, traceName, value, other, traceRoute);
    });


    //Workers are agnostic of lambda endpoints
    let workerInstances = {};

    Object.keys(workers).forEach( worker => {
        if(typeof workers[worker] === 'function') {
            workerInstances[worker] = setInterval(function(){
                injector({
                    logger : logger,
                    env : activeEnvironment,
                    tracer : tracer,
                    meter : meter,
                    i18n : i18n
                }, workers[worker]);
            }, worker.interval || DEFAULT_WORKER_INTERVAL);
        }
    });

    return Object.keys(lambdaFunctions).reduce( (acc, lambdaName) => {

        //add the active function to the tail end of the middlware array
        let middleware = policiesArray.concat(lambdaFunctions[lambdaName]);

        //allow you to specify the order of your middleware
        if(opts.orderMiddleware){
            middleware = middleware.sort(opts.orderMiddleware);
        }

        let useableDataServices = injectableDataServices;

        acc[lambdaName] = function(event, context, callback){

            function initServices(injectables, injectees) {
                return Object.keys(injectees).reduce((acc, injecteeName) => {
                    if (typeof injectees[injecteeName] === 'function') {
                        let injected = injector(Object.assign({
                            event: event,
                            context: context,
                            meter: meter,
                            tracer: tracer,
                            logger: logger,
                            i18n : i18n,
                            env : activeEnvironment
                        }, injectables), injectees[injecteeName]);

                        acc[injecteeName] = opts.disableTracer ? injected: metricTracer(injected);
                    }
                    else {
                        acc[injecteeName] = opts.disableTracer ? injectees[injecteeName]: metricTracer(injectees[injecteeName]);
                    }
                    return acc;
                }, {});
            }

            let mockContext = event[mockDataProperty] || context[mockDataProperty];
            if(mockContext){
                useableDataServices = structured.toImplentation(mockContext);
                Object.keys(injectableDataServices).forEach((serviceName) => {
                   if(typeof injectableDataServices[serviceName].overrideable === 'boolean' && !injectableDataServices[serviceName].overrideable){//if false but not falsey
                       useableDataServices[serviceName] = injectableDataServices[serviceName];
                   }
                });
            }

            //give hooks event,context, etc injectables
            let useableHooks = initServices({}, hooks);

            //give data services event,context injectables as well as hooks
            useableDataServices = initServices(useableHooks, useableDataServices);//allow dataservices to have event or context injected within

            let instantiatedServices = initServices(useableDataServices, services);

            //init responses with the ability to inject the callback and on the fly inject the 'data' param
            let untracedResponses = initResponses({ callback : callback }, responses);

            let injectableResponse   = opts.disableTracer? untracedResponses : metricTracer(untracedResponses);

            //generate middlware from custom middlware with injectables ( responses, dataServices, services )
            let injectableMiddlware  = initMiddleware(middleware, injectableResponse, useableDataServices, instantiatedServices);

            //create pipeline!
            let lambdaPipeline = pipeline({
                timeout : false
            }, injectableMiddlware);

            lambdaPipeline(context, injectableResponse, (context) => {
                injector({
                    // err : 'timeout',
                    // data : 'timed-out after 1000ms',
                    context: context,
                    logger : logger,
                    i18n : i18n,
                    env : activeEnvironment,
                    tracer : tracer,
                    meter : meter
                }, callback);
            });

        };

        return acc;
    }, {});

};