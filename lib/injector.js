/**
 * Created by daniel.irwin on 6/6/17.
 * resources used : https://davidwalsh.name/javascript-arguments
 */
'use strict';
module.exports = function (injectables, func, wrapperFunction, hook) {
    const LOG = injectables.logger?new injectables.logger('Injector', hook): { warn : () => {} };

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

        if(typeof fnc === 'function'){
            functionCallValue = fnc.apply(null, (args?args:getArgs(fnc).map(argName => inj[argName])));
        }

        if(typeof wrapperFunction === 'function'){
            return wrapperFunction(functionCallValue);
        }
        return functionCallValue;
    }

    function injectArray(array) {
        return array.reduce((acc, v) => {
            acc.push(function (req, res, next) {
                injectFunction(v, Object.assign({req: req, next: next}, injectables));
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
                injecteeMap[injectee] = getArgs(object[injectee]);
            }
        });

        let injResp = {};

        let runs = 0;
        while(injectees.length > 0 && MAX_RUNS > ++runs){
            let currentInjectable = injectees.shift();

            if (typeof object[injecteeName] === 'function') {
                if(typeof injectables.logger === 'function') {
                    injectables.LOG = new injectables.logger(injecteeName, hook);
                    injectables.console = injectables.LOG;//so you can just inject console
                }

                let anaylizeDep = argName => object[argName];

                let depdendencies = injecteeMap[injecteeName].map(analyizeDep);
                let allDependenciesResolved = depdendencies.every(e => e);

                if(allDependenciesResolved) {
                    injResp[injecteeName] = injectFunction(object[injecteeName], injectables, dependencies);
                }
                else {
                    injectees.push(currentInjectable);
                }
            }
            else {
                injResp[injecteeName] = object[injecteeName];
            }
        }

        if(injectees.length > 0) {
            injectees.forEach( injecteeName => {
                let depdendencies = injecteeMap[injecteeName].map(analyizeDep);
                let missingDependencies = depdendencies.filter(e => !e);
                LOG.warn(`last fail injecting ${injecteeName} even though missing ${missingDependencies}`);
                injResp[injecteeName] = injectFunction(object[injecteeName], injectables, dependencies);
            });
        }

        return injResp;
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