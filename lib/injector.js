/**
 * Created by daniel.irwin on 6/6/17.
 * resources used : https://davidwalsh.name/javascript-arguments
 */
'use strict';
module.exports = function (injectables, func, wrapperFunction, hook) {
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
            functionCallValue = fnc.apply(null, (args?args:getArgs(fnc)).map(argName => inj[argName]));
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

    function injectObject(object) {
        const injectees = Object.keys(object);
        let injecteeMap = {};
        injectees.forEach((injectee) => {
            if (typeof object[injectee] === 'function') {
                injecteeMap[injectee] = getArgs(object[injectee]);
            }
        });

        return injectees.reduce((acc, injecteeName) => {
            if (typeof object[injecteeName] === 'function') {
                if(typeof injectables.logger === 'function') {
                    injectables.LOG = new injectables.logger(injecteeName, hook);
                    injectables.console = injectables.LOG;//so you can just inject console
                }
                acc[injecteeName] = injectFunction(object[injecteeName], injectables, injecteeMap[injecteeName]);
            }
            else {
                acc[injecteeName] = object[injecteeName];
            }
            return acc;
        }, {});
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