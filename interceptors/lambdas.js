/**
 * Created by daniel.irwin on 6/23/17.
 */
module.exports = function (opts) {

    process.on('uncaughtexception', (e) => {
        console.log('', e);
    });

    process.on('uncaughtexception', (e) => {
        console.log('', e);
    });

    console.log('opts', opts);

    const DEFAULT_WORKER_INTERVAL = 60 * 1000;//every minute

    let directoryLoader = require('../lib/multiDirLoader');

    let dirFilter = opts.fileFilter || function(a) {
        return a.indexOf('app.js') === -1 &&
            a.indexOf('node_modules') === -1 &&
            a.indexOf('demo') === -1 &&
            a.indexOf('tmp') === -1 &&
            a.indexOf('bin') === -1
    };

    let dir = opts.dir || process.cwd();

    let lib = directoryLoader(`${__dirname}/../lib/`, dirFilter);
    let app = directoryLoader(`${dir}/`, dirFilter);

    let routes = opts.routes || [];

    let activeEnvironment = (app.Environments || {})[opts.env || process.env.ENVIRONMENT || 'dev'];
    if (!activeEnvironment) {
        process.stderr.write('error no active environment to set the active environment set the ENVIRONMENT variable - default:dev\n');
    }

    console.log('active env', activeEnvironment);

    let injectableDataServices = {};

    let swagger = lib.docGenerator.generateFromUrls(Object.keys(routes), routes.headers);

    console.log('swagger', swagger);

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

    console.log('i data services', injectableDataServices);

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

            console.log('generating func', lambdaName);
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
                        context: context,
                        environment : activeEnvironment
                    }, useableDataServices, injectables), injectees, opts.disableTracer ? null : metricTracer);
                }

                let mockContext = (typeof opts.mockContext === 'function') ? opts.mockContext(event, context) : null;//user includes a function to extra mocks
                if (mockContext) {
                    useableDataServices = runtimeMockDataServices(useableDataServices, mockContext);
                }

                //give hooks event,context, etc injectables
                let useableHooks = injectWrapper({}, app.Hooks);
console.log('injecting hooks');
                let injectables = Object.assign({}, injectableResponse, useableHooks);

                //give data services event,context injectables as well as hooks
                useableDataServices = injectWrapper(injectables, useableDataServices);//allow dataservices to have event or context injected within
                console.log('injecting dataservices');
                injectables = Object.assign(injectables, useableDataServices);

                //allow someone who can be called by Services that also has access to dataservices for convenience
                let useableDataServiceUtils = injectWrapper(injectables, app.DataServiceUtils || {});
                console.log('injecting dataserviceutils');
                injectables = Object.assign(injectables, useableDataServiceUtils);

                let instantiatedServices = injectWrapper(injectables, app.Services);
                console.log('injecting services');
                injectables = Object.assign(injectables, instantiatedServices);

                //generate middlware from custom middlware with injectables ( responses, dataServices, services )
                let injectableMiddlware = injectWrapper(injectables, middleware);
                console.log('injecting middleware');
                //create pipeline!
                lib.pipeline({
                    timeout: false
                }, injectableMiddlware)(context, injectableResponse, (event, context) => {
                    console.log('pipeline execution');
                    injector({
                        event: event,
                        context: context,
                        logger: lib.logger,
                        i18n: lib.i18n,
                        env: activeEnvironment,
                        tracer: lib.tracer,
                        meter: lib.meter,
                        environment: activeEnvironment
                    }, callback);
                });
            };

            return acc;
        }, {});
    };

    function generatorReadyData(inputServices){
        return Object.keys(inputServices).reduce((services, serviceName) => {
            services[serviceName] = Object.keys(inputServices[serviceName]).reduce((service, funcName) => {
                if(['restClient', 'init', 'interpolate', 'debug', 'initialized', 'fncVarReplacements'].indexOf(funcName) === -1){
                    service[funcName] = inputServices[serviceName][funcName];
                }
                return service;
            }, {});
            return services;
        }, {});
    }

    function generatorSchema(schema){
        return lib.structured.toGenerator(schema);
    }

    function mockSchema(schema){
        return lib.structured.toStructure(schema);
    }

    //support for newer interceptor
    if(opts.edge){
        let dataServiceSchema = generatorReadyData(injectableDataServices);
        return {
            functions : app.Functions,
            lambdasGenerator : generateExecutableLambdas,
            dataServices : injectableDataServices,
            swagger : swagger,
            workers : workerInstances,
            mockGenerator : generatorSchema(dataServiceSchema),
            mockSchema : mockSchema(dataServiceSchema),
            mockContext : opts.mockContext==='function'?opts.mockContext.toString():null,
            pipelines : generateExecutableLambdas(app.Functions)
        };
    }
    else {
        console.log('generateExecutableLambdas');
        return generateExecutableLambdas(app.Functions);
    }

};