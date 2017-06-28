/**
 * Created by daniel.irwin on 6/6/17.
 */
'use strict';
module.exports = function(injectables, func){
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

    if(typeof injectables === 'object' && typeof func === 'function') {
        return func.apply(null, getArgs(func).map(argName => injectables[argName]));
    }
    return {};
};