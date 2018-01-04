/**
 * Created by daniel.irwin on 6/23/17.
 */
module.exports = function (opts) {

    let loggerFactory = require('../lib/logger');
    let logger = new loggerFactory('Lambda-Interceptor', { level : (opts.logLevel||'warn') });

    let directoryLoader = require('../lib/multiDirLoader');

    let dirFilter = opts.fileFilter || function (a) {
        return a.indexOf('app.js') === -1 &&
            a.indexOf('node_modules') === -1 &&
            a.indexOf('demo') === -1 &&
            a.indexOf('tmp') === -1 &&
            a.indexOf('bin') === -1
    };

    let dir = opts.dir;
    if(!dir){
        dir = process.cwd();
        logger.warn(`you did not include a "dir" property, loading from ${dir}...`);
    }

    let lib = directoryLoader(`${__dirname}/../lib/`, dirFilter);
    let utils = lib.interceptorUtils;

    let app = opts.app || directoryLoader(`${dir}/`, dirFilter);//allow client to pass in own app structure

    //Pre pop all parts if missing
    if (typeof app === 'object' && typeof app.Functions === 'object') {//if you have no 'lambda' functions your going to have a bad time
        utils.fillEmpty(app, ['DataServices', 'DataServiceUtils', 'Environments', 'Hooks', 'Policies', 'Responses', 'Services', 'Workers'], null, (name) => {
            logger.warn(`no ${name} where found`);
        });
    }
    else {
        //panic
        logger.critical(`failed to find app missing app=${typeof app === 'object'} missing functions=${typeof app.Functions === 'object'}`);
        process.exit(1);
    }

    if (typeof opts.appOverrides === 'object') {
        app = Object.assign(app, opts.appOverrides);
    }

    let routes = [];
    if (typeof opts.routes === 'object' && Array.isArray(opts.routes)) {//TODO: later we could use concat to add default routes such as swagger
        routes = opts.routes;
    }

    let activeEnvironment = (app.Environments || {})[opts.env || process.env.ENVIRONMENT || 'dev'];
    if (typeof activeEnvironment !== 'object') {
        logger.warn('error no active environment to set the active environment set the ENVIRONMENT variable - default:dev\n');
        activeEnvironment = {};//fix it sort of ?
    }

    let swagger = lib.docGenerator.generateFromUrls(Object.keys(routes), routes.headers);


    //reconstruct Policies into array from map losing the policies name in the process
    let policiesArray = Object.keys(app.Policies || {}).reduce((acc, v) => {
        acc.push(app.Policies[v]);
        return acc;
    }, []);


    let injectableDataServices = utils.clientBuild(app.DataServices, activeEnvironment);

    let injectables = {
        logger: lib.logger,
        env: activeEnvironment,
        environment: activeEnvironment,
        tracer: lib.tracer,
        meter: lib.meter,
        i18n: lib.i18n,
        swagger: swagger
    };

    let workerInstances = utils.setupWorkers(app.Workers, injectables);

    function generateExecutableLambdas(functions) {
        return Object.keys(functions || {}).reduce((acc, lambdaName) => {

            //add the active function to the tail end of the middlware array
            let middleware = policiesArray.concat(functions[lambdaName]);

            //allow you to specify the order of your middleware
            if (typeof opts.orderMiddleware === 'function') {
                middleware = middleware.sort(opts.orderMiddleware);
            }

            acc[lambdaName] = function (event, context, callback) {

                if(typeof context === 'object') {
                    context.arupexAudit = [];
                }

                let auditor = {
                    logLevel : 'info',
                    errStream : {
                        write : typeof opts.errStreamWrite === 'function'? opts.errStreamWrite:function(data){
                            process.stderr.write(data);
                            if(context && Array.isArray(context.arupexAudit)) {
                                context.arupexAudit.push({errStream :data});
                            }
                        }
                    },
                    outStream : {
                        write : typeof opts.outStreamWrite === 'function'?opts.outStreamWrite:function(data){
                            process.stdout.write(data);
                            if(context && Array.isArray(context.arupexAudit)) {
                                context.arupexAudit.push({ outStream : data});
                            }
                        }
                    }
                };

                if (typeof context === 'object' && !opts.callbackWaitsForEmptyEventLoop) {
                    context.callbackWaitsForEmptyEventLoop = false;//so aws does not keep running lambda after callback
                }

                let metricTracer = opts.disableTracer? null : lib.metricTracer(opts.meterFnc, opts.traceFnc, auditor);

                //give hooks event,context, etc injectables
                let coreRuntimeInjectables = Object.assign(injectables, {
                    event: event,
                    context: context
                });

                //init responses with the ability to inject the callback and on the fly inject the 'data' param
                let injectableResponse = utils.injectDataFirst(Object.assign(coreRuntimeInjectables, { callback : callback }), app.Responses, metricTracer);
                coreRuntimeInjectables.res = injectableResponse;

                let useableDataServices = Object.keys(injectableDataServices).reduce((acc, serviceName) => {
                    if(typeof injectableDataServices[serviceName] === 'object' && typeof injectableDataServices[serviceName].setLogger === 'function'){
                        injectableDataServices[serviceName].setLogger(new loggerFactory(serviceName, auditor));
                    }
                    acc[serviceName] = injectableDataServices[serviceName];
                    return acc;
                }, {});

                let mockContext = (typeof opts.mockContext === 'function') ? opts.mockContext(event, context) : null;//user includes a function to extra mocks
                if (mockContext) {
                    logger.info('mocks are enabled for this session');
                    useableDataServices = utils.runtimeMockDataServices(useableDataServices, mockContext);
                }

                let injectableMiddlware = utils.aggregateInjector(Object.assign(coreRuntimeInjectables), [
                    app.Hooks,//must be first
                    useableDataServices,
                    app.DataServiceUtils,
                    app.Services,
                    middleware//must be last
                ], metricTracer, auditor);

                //create pipeline!
                lib.pipeline({
                    timeout: false
                }, injectableMiddlware)(context, injectableResponse, (event, context) => {
                    lib.injector(Object.assign(coreRuntimeInjectables, {
                        event: event,
                        context: context
                    }), callback, null, auditor);
                });
            };

            return acc;
        }, {});
    }

    //support for newer interceptor edge will be removed in a major release as a breaking change
    if (opts.edge) {
        let dataServiceSchema = lib.interceptorUtils.generatorReadyData(injectableDataServices);
        return {
            functions: app.Functions,
            lambdasGenerator: generateExecutableLambdas,
            dataServices: injectableDataServices,
            swagger: swagger,
            workers: workerInstances,
            mockGenerator: lib.structured.toGenerator(dataServiceSchema),
            mockSchema: lib.structured.toStructure(dataServiceSchema),
            mockContext: opts.mockContext === 'function' ? opts.mockContext.toString() : null,
            pipelines: generateExecutableLambdas(app.Functions)
        };
    }
    else {
        return generateExecutableLambdas(app.Functions);
    }

};