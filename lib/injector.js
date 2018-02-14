/**
 * Created by daniel.irwin on 6/6/17.
 * resources used : https://davidwalsh.name/javascript-arguments
 */
'use strict';
module.exports = function (injectables, func, wrapperFunction, hook) {
    const logger = require('./logger');
    const LOG = new logger('Arupex-Injector');

    function getArgs(func) {
        let args = func.toString()
            .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '')
            .replace(/=>.*$/mg, '')
            .replace(/=[^,]+/mg, '')
            .match(/\((.*)\)/);
        if (args) {
            return args[1].match(/([^\s,]+)/g) || [];
        }
        return [];
    }

    function injectFunction(fnc, inj, args) {
        let functionCallValue = {};

        if(typeof fnc === 'function') {
            const argArray = (args ? args : getArgs(fnc)).map(argName => {
                if (inj[argName]) {
                    return inj[argName]
                }
                LOG.critical(`you requested ${argName} but it is not available for injection`);
            });

            functionCallValue = fnc.apply(null, argArray);
        }

        if(typeof wrapperFunction === 'function'){
            return wrapperFunction(functionCallValue);
        }
        return functionCallValue;
    }

    function injectArray(array) {
        return array.reduce((acc, v) => {
            acc.push(function (req, res, next) {
                injectFunction(v, Object.assign({req: req, next: next}, injectables), null);
            });
            return acc;
        }, []);
    }

    /**
     * Injects an object such as the Services directory
     * @param object
     * @param attemptToResolveOrderedDepedendencies
     * @returns {{}}
     */
    function injectObject(object) {
        const injectees = Object.keys(object);
        const MAX_RUNS = injectees.length * injectees.length;

        let injecteeMap = {};
        injectees.forEach((injectee) => {
            if (typeof object[injectee] === 'function') {
                injecteeMap[injectee] = getArgs(object[injectee]).filter(e=>e);
            }
        });
        
        let runs = 0;
        while((injectees.length > 0) && (MAX_RUNS > runs)){
            let injecteeName = injectees.shift();

            if (typeof object[injecteeName] === 'function') {
                if(typeof injectables.logger === 'function') {
                    injectables.LOG = new injectables.logger(injecteeName, hook);
                    injectables.console = injectables.LOG;//so you can just inject console
                }

                let dependencies = injecteeMap[injecteeName].map(e => injectables[e]);
                let allDependenciesResolved = (dependencies.length > 0)? dependencies.every(e => e): true;

                if(allDependenciesResolved) {
                    injectables[injecteeName] = injectFunction(object[injecteeName], injectables, injecteeMap[injecteeName]);
                }
                else {
                    injectees.push(injecteeName);
                }
            }
            else {
                injectables[injecteeName] = object[injecteeName];
            }

            runs++;
        }

        if(injectees.length > 0) {
            injectees.forEach( injecteeName => {
                if (typeof object[injecteeName] === 'function') {
                    if(typeof injectables.logger === 'function') {
                        injectables.LOG = new injectables.logger(injecteeName, hook);
                        injectables.console = injectables.LOG;//so you can just inject console
                    }
                    let missingDependencies = injecteeMap[injecteeName].filter(e => !injectables[e]);
                    LOG.warn(`last fail injecting ${injecteeName} even though missing ${JSON.stringify(missingDependencies)}`);
                    injectables[injecteeName] = injectFunction(object[injecteeName], injectables, injecteeMap[injecteeName]);
                }
            });
        }

        return injectables;
    }

    // Decision Tree
    // 4 possibilities,
    //  - 1 not acceptable (injectables is not an object or func is not useable)
    //  - 2 func is function do a direct inject on it
    //  - 3 func is object do an inject on function child properties
    //  - 4 func is array do an inject on function values
    let result = {};
    if (typeof injectables === 'object') {
        if (typeof func === 'function') {
            result = injectFunction(func, injectables);
        }

        if (typeof func === 'object') {
            if (Array.isArray(func)) {
                result = injectArray(func);
            }
            else {
                result = injectObject(func);
            }
        }
    }
    return result;
};