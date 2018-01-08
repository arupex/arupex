// TODO / FIXME : this needs unit tests!!!

module.exports = {
    injector: require('./injector'),
    structured: require('./structured'),
    clientBuilder: require('./clientBuilder'),
    logger : require('./logger'),

    injectDataFirst: function initResponses(injectables, responses, wrap, hook) {
        return Object.keys(responses).reduce((acc, v) => {
            let response = (data) => {//it is assumed that responses have 1 external parameter from the user (function)
                let LOG;
                if(typeof injectables.logger === 'function'){
                    LOG = new injectables.logger(v, hook);
                }
                this.injector(Object.assign({data: data}, injectables, { LOG : LOG, console : LOG }), responses[v]);
            };
            acc[v] = typeof wrap === 'function' ? wrap(response) : response;
            return acc;
        }, {});
    },


    /**
     * Injects a bunch of things one after each other injecting all previous siblings
     * returns last one in
     * @param initialInjectables
     * @param injectees
     * @param wrap
     *
     * @returns {*}
     */
    aggregateInjector: function aggregateInjector(initialInjectables, injectees, wrap, hook) {
        let injectables = initialInjectables;

        let last = {};
        injectees.forEach((injectee) => {
            last = this.injector(injectables, injectee, wrap, hook);
            injectables = Object.assign(injectables, last);
        });

        return last;
    },


    generatorReadyData: function generatorReadyData(inputServices) {
        return Object.keys(inputServices).reduce((services, serviceName) => {
            services[serviceName] = Object.keys(inputServices[serviceName]).reduce((service, funcName) => {
                if (['restClient', 'init', 'interpolate', 'debug', 'initialized', 'fncVarReplacements', 'setLogger', '_log'].indexOf(funcName) === -1) {
                    service[funcName] = inputServices[serviceName][funcName];
                }
                return service;
            }, {});
            return services;
        }, {});
    },

    /**
     * this function overrides real DataServiceClients with mocks if mock context exists,
     * it will only preserve the real service if it has a overrideable false flag
     *
     * @param useableDataServices
     * @param mockContext
     * @returns {*}
     */
    runtimeMockDataServices: function runtimeMockDataServices(useableDataServices, mockContext) {
        if (typeof useableDataServices !== 'object') {
            return {};
        }

        if (typeof mockContext !== 'object') {
            return useableDataServices;
        }

        Object.keys(useableDataServices).forEach((serviceName) => {
            if (typeof useableDataServices[serviceName].overrideable !== 'boolean' || useableDataServices[serviceName].overrideable) {
                useableDataServices[serviceName] = this.structured.toImplentation(mockContext[serviceName]);
                // useableDataServices[serviceName] = injectableDataServices[serviceName];
            }
        });

        return useableDataServices;
    },


    /**
     * Workers are agnostic of lambda endpoints as well as DataServices/Hooks and all other injectables
     * workers are injected with a logger, env, tracer, meter, i18n libraries
     */
    setupWorkers: function setupWorkers(workers, injectables) {
        const DEFAULT_WORKER_INTERVAL = 60 * 1000;//every minute

        let workerInstances = {};
        if (typeof workers === 'object') {
            Object.keys(workers).forEach(worker => {
                if (typeof workers[worker] === 'function') {
                    workerInstances[worker] = setInterval( () => {
                        this.injector(injectables, workers[worker]);
                    }, worker.interval || DEFAULT_WORKER_INTERVAL);
                }
            });
        }
        return workerInstances;
    },


    /**
     * if an injectable by a name is missing prepopulate it with an empty object
     * @param app
     * @param names
     * @param defaults
     * @param warn
     */
    fillEmpty: function fixInjectable(app, names, defaults, warn) {
        names.forEach((name) => {
            if (typeof app[name] !== 'object') {
                app[name] = {};
                if(typeof warn === 'function'){
                    warn(name);
                }
            }
            //TODO : this could also in the future add some default Responses/Hooks/Policies/etc
            app[name] = Object.assign(app[name], defaults);
        });
    },


    /**
     * This function initializes DataService Clients
     * @param nonInjectableServices
     * @param activeEnvironment
     * @returns {*}
     */
    clientBuild: function calculateInjectableDataServices(nonInjectableServices, activeEnvironment, loggerHooks) {
        if(loggerHooks === null || typeof loggerHooks !== 'object') {
            loggerHooks = {};
        }

        const internalLogger = new this.logger('interceptor-utils', { level : activeEnvironment.logLevel || 'crucial' });

        const elementIsObject = dataServiceArrayElement => (dataServiceArrayElement !== null) && (typeof dataServiceArrayElement === 'object') && (Object.keys(dataServiceArrayElement).length === 1);

        const configurableDataServices = Object.keys(activeEnvironment);

        if (typeof nonInjectableServices === 'object') {
                return Object.keys(nonInjectableServices).reduce((acc, v) => {

                    const serviceExistsInEnvironmentConfig = (activeEnvironment[v] !== null && typeof activeEnvironment[v] === 'object');
                    const serviceIsANonNullObject = (nonInjectableServices[v] !== null && typeof nonInjectableServices[v] === 'object');
                    const serviceIsANonNullFunction = (nonInjectableServices[v] !== null && typeof nonInjectableServices[v] === 'function');

                    const serviceIsLikelyAnArupexClient = serviceIsANonNullObject && Array.isArray(nonInjectableServices[v]) && nonInjectableServices[v].some(elementIsObject);

                    internalLogger.debug(`configuring ${v}: serviceExistsInEnvironmentConfig=${serviceExistsInEnvironmentConfig} | serviceIsANonNullObject=${serviceIsANonNullObject} | serviceIsANonNullFunction=${serviceIsANonNullFunction} | serviceIsLikelyAnArupexClient=${serviceIsLikelyAnArupexClient} ...`);

                    if(serviceExistsInEnvironmentConfig &&
                        serviceIsANonNullObject &&
                        serviceIsLikelyAnArupexClient ) {
                        let activeLoggerHook = Object.assign({}, loggerHooks);
                        if(activeEnvironment[v].logLevel){
                            activeLoggerHook.level = activeEnvironment[v].logLevel;
                        }
                        internalLogger.debug(`${v} is being initalized as an arupex client...`);
                        activeEnvironment[v].logger = new this.logger(v, activeLoggerHook).info;//has to be a function for hyper-request to work
                        acc[v] = this.clientBuilder(nonInjectableServices[v]).init(activeEnvironment[v]);
                    }
                    else {
                        if(!serviceExistsInEnvironmentConfig) {
                            internalLogger.warn(`only the following are considered configurable dataservices`, configurableDataServices);
                        }

                        if(!serviceExistsInEnvironmentConfig && serviceIsLikelyAnArupexClient) {
                            internalLogger.critical(`${v} appears to be an arupex client! however it appears to have no environment configuration, so it will be treated as an Array or objects and not initialized...`);
                        }
                        else {

                            if(!serviceExistsInEnvironmentConfig) {
                                internalLogger.warn(`environment did not include config for ${v} skipping as client, may be misconfigured...included as raw object`);
                            }

                            if(!serviceIsANonNullObject && !serviceIsANonNullFunction) {
                                internalLogger.critical(`${v} was non object-function/not null...`);
                            }

                            if(!serviceIsLikelyAnArupexClient) {
                                internalLogger.warn(`${v} does appears to not be an arupex client`);
                            }
                        }

                        acc[v] = nonInjectableServices[v];//not a client
                    }

                    return acc;
                }, {});
        }
        return {};
    }


};