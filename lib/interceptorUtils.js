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
                this.injector(Object.assign({data: data}, injectables, { LOG : LOG }), responses[v]);
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
        const internalLogger = new this.logger('interceptor-utils');

        const allElementsAreObjects = k => {

            if (typeof k !== 'object') {
                return false;
            }
            return Object.keys(k).length > 1;
        };

        if (typeof nonInjectableServices === 'object') {
                return Object.keys(nonInjectableServices).reduce((acc, v) => {

                    const serviceExistsInEnvironmentConfig = activeEnvironment[v] && typeof activeEnvironment[v] === 'object';
                    const serviceIsANonNullObject = nonInjectableServices[v] !== null && typeof nonInjectableServices[v] === 'object';
                    const serviceIsLikelyAnArupexClient = serviceIsANonNullObject && Array.isArray(nonInjectableServices[v]) && nonInjectableServices[v].some(allElementsAreObjects);

                    if(serviceExistsInEnvironmentConfig &&
                        serviceIsANonNullObject &&
                        serviceIsLikelyAnArupexClient ) {

                            activeEnvironment[v].logger = new this.logger(v, loggerHooks);
                            acc[v] = this.clientBuilder(nonInjectableServices[v]).init(activeEnvironment[v]);
                    }
                    else {

                        if(!serviceExistsInEnvironmentConfig && serviceIsLikelyAnArupexClient) {
                            internalLogger.critical(`${v} appears to be an arupex client! however it appears to have no environment configuration, so it will be treated as an Array or objects and not initialized...`);
                        }
                        else {

                            if(!serviceExistsInEnvironmentConfig) {
                                internalLogger.warn(`environment did not include config for ${v} skipping as client, may be misconfigured...`);
                            }
                            if(!serviceIsANonNullObject) {
                                internalLogger.critical(`${v} was non object/not null...`);
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