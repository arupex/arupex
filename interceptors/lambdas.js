/**
 * Created by daniel.irwin on 6/23/17.
 */
module.exports = function (opts) {

    const DEFAULT_WORKER_INTERVAL = 60 * 1000;//every minute

    let directoryLoader = require('../lib/multiDirLoader', opts.fileFilter || function(a) {return (a.indexOf('app.js') === -1 && a.indexOf('node_modules') === -1)});

    let dir = opts.dir || process.cwd();

    let lib = directoryLoader(`${__dirname}/../lib/`);
    let app = directoryLoader(`${dir}/`);

    let routes = opts.routes || [];

    let activeEnvironment = (app.Environments || {})[process.env.ENVIRONMENT || 'dev'];
    if (!activeEnvironment) {
        process.stderr.write('error no active environment to set the active environment set the ENVIRONMENT variable - default:dev\n');
    }

    let injectableDataServices = {};

    let swagger = lib.docGenerator.generateFromUrls(Object.keys(routes), routes.headers);

    function calculateInjectableDataServices(nonInjectableServices) {
        if (nonInjectableServices) {
            return Object.keys(nonInjectableServices).reduce((acc, v) => {
                if (Array.isArray(nonInjectableServices[v])) {
                    if (!activeEnvironment[v]) {
                        process.emit('error', 'environment did not include config for ' + v);
                    }
                    acc[v] = lib.clientBuilder(nonInjectableServices[v]).init(activeEnvironment[v]);
                }
                else {
                    acc[v] = nonInjectableServices[v];//not a client
                }
                return acc;
            }, {});
        }
        return {};
    }

    injectableDataServices = calculateInjectableDataServices(app.DataServices);

    let policiesArray = Object.keys(app.Policies || {}).reduce((acc, v) => {
        acc.push(app.Policies[v]);
        return acc;
    }, []);

    let metricTracer = lib.metricTracer(opts.meterFnc, opts.traceFnc);

    function initResponses(injectables, responses) {
        return Object.keys(responses).reduce((acc, v) => {
            let response = function (data) {//it is assumed that responses have 1 external parameter from the user (function)
                lib.injector(Object.assign({data: data}, injectables), responses[v]);
            };
            acc[v] = opts.disableTracer ? response : metricTracer(response);
            return acc;
        }, {});
    }

    //Workers are agnostic of lambda endpoints
    let workerInstances = {};

    if (app.Workers) {
        Object.keys(app.Workers).forEach(worker => {
            if (typeof app.Workers[worker] === 'function') {
                workerInstances[worker] = setInterval(function () {
                    lib.injector({
                        logger: lib.logger,
                        env: activeEnvironment,
                        tracer: lib.tracer,
                        meter: lib.meter,
                        i18n: lib.i18n
                    }, app.Workers[worker]);
                }, worker.interval || DEFAULT_WORKER_INTERVAL);
            }
        });
    }

    function runtimeMockDataServices(useableDataServices, mockContext) {
        useableDataServices = lib.structured.toImplentation(mockContext);
        Object.keys(injectableDataServices).forEach((serviceName) => {
            if (typeof injectableDataServices[serviceName].overrideable === 'boolean' && !injectableDataServices[serviceName].overrideable) {//if false but not falsey
                useableDataServices[serviceName] = injectableDataServices[serviceName];
            }
        });
        return useableDataServices;
    }

    let generateExecutableLambdas = function (functions) {
        return Object.keys(functions || {}).reduce((acc, lambdaName) => {

            //add the active function to the tail end of the middlware array
            let middleware = policiesArray.concat(functions[lambdaName]);

            //allow you to specify the order of your middleware
            if (opts.orderMiddleware) {
                middleware = middleware.sort(opts.orderMiddleware);
            }

            acc[lambdaName] = function (event, context, callback) {

                //init responses with the ability to inject the callback and on the fly inject the 'data' param
                let injectableResponse = initResponses({callback: callback}, app.Responses || {});
                let useableDataServices = injectableDataServices;

                function injectWrapper(injectables, injectees) {
                    return lib.injector(Object.assign({
                        res: injectableResponse,
                        i18n: lib.i18n,
                        meter: lib.meter,
                        tracer: lib.tracer,
                        logger: lib.logger,
                        swagger: swagger,
                        event: event,
                        context: context
                    }, useableDataServices, injectables), injectees, opts.disableTracer ? null : metricTracer);
                }

                let mockContext = (typeof opts.mockContext === 'function') ? opts.mockContext(event, context) : null;//user includes a function to extra mocks
                if (mockContext) {
                    useableDataServices = runtimeMockDataServices(useableDataServices, mockContext);
                }

                //give hooks event,context, etc injectables
                let useableHooks = injectWrapper({}, app.Hooks);

                let injectables = Object.assign({}, injectableResponse, useableHooks);

                //give data services event,context injectables as well as hooks
                useableDataServices = injectWrapper(injectables, useableDataServices);//allow dataservices to have event or context injected within

                injectables = Object.assign(injectables, useableDataServices);

                //allow someone who can be called by Services that also has access to dataservices for convenience
                let useableDataServiceUtils = injectWrapper(injectables, app.DataServiceUtils || {});

                injectables = Object.assign(injectables, useableDataServiceUtils);

                let instantiatedServices = injectWrapper(injectables, app.Services);

                injectables = Object.assign(injectables, instantiatedServices);

                //generate middlware from custom middlware with injectables ( responses, dataServices, services )
                let injectableMiddlware = injectWrapper(injectables, middleware);

                //create pipeline!
                lib.pipeline({
                    timeout: false
                }, injectableMiddlware)(context, injectableResponse, (event, context) => {
                    injector({
                        event: event,
                        context: context,
                        logger: lib.logger,
                        i18n: lib.i18n,
                        env: activeEnvironment,
                        tracer: lib.tracer,
                        meter: lib.meter
                    }, callback);
                });
            };

            return acc;
        }, {});
    };

    //support for newer interceptor
    if(opts.edge){
        return {
            functions : app.Functions,
            lambdasGenerator : generateExecutableLambdas,
            dataServices : injectableDataServices,
            swagger : swagger,
            workers : workerInstances
    };
    }
    else {
        return generateExecutableLambdas(app.Functions);
    }

};