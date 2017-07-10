/**
 * Created by daniel.irwin on 6/6/17.
 */
'use strict';
module.exports = function (injectables, func, wrapperFunction) {
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

    function injectFunction(fnc, inj) {
        let functionCallValue = {};

        if(typeof fnc === 'function'){
            functionCallValue = fnc.apply(null, getArgs(fnc).map(argName => inj[argName]));
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
        return Object.keys(object).reduce((acc, injecteeName) => {
            if (typeof object[injecteeName] === 'function') {
                acc[injecteeName] = injectFunction(object[injecteeName], injectables);
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