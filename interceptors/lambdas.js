/**
 * Created by daniel.irwin on 6/23/17.
 */
module.exports = function(app, activeEnvironment, Auditor, swagger, directoryLoader, injectableDataServices, lib, utils, outerInjectables) {

    return function ({
                       logLevel = 'info',
                       routes = {},
                       dir = process.cwd(),
                       env = 'dev',
                       callbackWaitsForEmptyEventLoop = false,
                       disableTracer = true,
                       orderMiddleware,
                       mockContext
                    }) {

    const LogFactory = require('../lib/LoggerFactory');
    let workerInstances = utils.setupWorkers(app.Workers, outerInjectables);

    function generateExecutableLambdas(functions) {
        return Object.keys(functions || {}).reduce((acc, lambdaName) => {

            acc[lambdaName] = function (event, context, callback) {

                const audit = new Auditor({
                    entryPoint : lambdaName,
                    uid :Auditor.generateUID()
                });


                const eventLogFactory = new LogFactory({ audit : audit.audit }).getLogger();
                const LOG = new eventLogFactory(`Arupex-Interceptor-${lambdaName}`);

                let coreRuntimeInjectables = utils.aggregateInjector(Object.assign({},
                    outerInjectables, {
                    functionName : lambdaName,
                    arupexlib: lib,
                    logger: eventLogFactory,
                    env: activeEnvironment,
                    environment: activeEnvironment,
                    tracer: lib.tracer,
                    meter: lib.meter,
                    i18n: lib.i18n,
                    swagger: swagger,
                    directoryLoader: directoryLoader,
                    event: event,
                    context: context,
                    callback: callback
                }), [
                    app.Core,
                    app.Models
                ]);

                if (typeof context === 'object') {
                    context.arupexAudit = [];
                }


                if (typeof context === 'object' && !callbackWaitsForEmptyEventLoop) {
                    context.callbackWaitsForEmptyEventLoop = false;//so aws does not keep running lambda after callback
                }

                let metricTracer = disableTracer ? null : lib.metricTracer(audit.audit, eventLogFactory);

                //init responses with the ability to inject the callback and on the fly inject the 'data' param
                let injectableResponse = utils.injectDataFirst(coreRuntimeInjectables, app.Responses, metricTracer);
                coreRuntimeInjectables.res = injectableResponse;

                let useableDataServices = Object.keys(injectableDataServices).reduce((acc, serviceName) => {
                    if (typeof injectableDataServices[serviceName] === 'object' && typeof injectableDataServices[serviceName].setLogger === 'function') {
                        injectableDataServices[serviceName].setLogger(new eventLogFactory(serviceName, auditor));
                    }
                    if (typeof injectableDataServices[serviceName] === 'object' && typeof injectableDataServices[serviceName].subClient === 'function') {
                        acc[serviceName] = injectableDataServices[serviceName].subClient(new eventLogFactory(serviceName, auditor.audit), auditor.audit);
                    }
                    else {
                        acc[serviceName] = injectableDataServices[serviceName];
                    }
                    return acc;
                }, {});

                let mockContext = (typeof mockContext === 'function') ? lib.injector(coreRuntimeInjectables, mockContext, null, auditor) : null;//user includes a function to extra mocks
                if (mockContext) {
                    LOG.info('mocks are enabled for this session');
                    useableDataServices = utils.runtimeMockDataServices(useableDataServices, mockContext);
                }


                //add the active function to the tail end of the middlware array
                let middleware = policiesArray.concat(functions[lambdaName]);

                //allow you to specify the order of your middleware
                if (typeof orderMiddleware === 'function') {
                    middleware = middleware.sort(orderMiddleware);
                }

                // Guarantee that old stuff is gone
                let injectableMiddlware = utils.aggregateInjector(coreRuntimeInjectables, [
                    app.Hooks,//must be first
                    useableDataServices,
                    app.DataServiceUtils,
                    app.Services,
                ], metricTracer);

                //middleware
                let mid = injector.injectArray(middleware);

                //create pipeline!
                lib.pipeline({
                    timeout: false
                }, mid)(context, injectableResponse, (event, context) => {
                    callback('Arupex Hit a Dead-End');
                    // lib.injector(d, callback, null, auditor);
                });
            };

            return acc;
        }, {});
    }

        let dataServiceSchema = lib.interceptorUtils.generatorReadyData(injectableDataServices);
        return {
            functions: app.Functions,
            lambdasGenerator: generateExecutableLambdas,
            dataServices: injectableDataServices,
            swagger: swagger,
            workers: workerInstances,
            mockGenerator: lib.structured.toGenerator(dataServiceSchema),
            mockSchema: lib.structured.toStructure(dataServiceSchema),
            mockContext: mockContext === 'function' ? mockContext.toString() : null,
            pipelines: generateExecutableLambdas(app.Functions)
        };

}
};