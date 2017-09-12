/**
 * Created by daniel.irwin on 6/20/17.
 */
module.exports = {

    /**
     * Spreader allws you to associate multiple functions with 1 call
     * ie, let i = spreader(ok, success, next, good, finally);
     * i('yup') // calls ok, success, next, good, finally all with 'yup'
     * @returns {result}
     */
    spreader: function() {
        let argz = arguments;//allow args to be scoped inside the closure
        let result = function() {
            for (let i = 0; i < argz.length; ++i) {
                if (typeof argz[i] === 'function') {
                    argz[i].apply({}, arguments);//create an artificial scope for the apply
                }
            }
        };

        //helpful if you use spreader in a recursive function
        // and dont want to keep making spreader functions of spreader functions
        result.isSpreaderFunctions = true;

        return result;
    },

    queryData: function (data, query) {
        if(typeof data === 'object') {
            if (typeof query === 'string') {
                return data[query];//happy path
            }
            else if (typeof query === 'object') {
                const foundKey = Object.keys(data).find( (key) => {
                    try {
                        key = JSON.parse(key);
                    }
                    catch(e){}

                    if(typeof key === 'object'){
                        return Object.keys(key).every( (subKey) => {
                            return query[subKey] === key[subKey];
                        });
                    }
                });
                if(foundKey){
                    return data[foundKey];
                }
            }
        }
        else if(typeof data !== 'undefined' && data){
            return data;
        }
        return null;
    },

    conform: function (success, error, queriableData) {
        return function inCall() {
            let isFunc = function (p) {
                return typeof p === 'function';
            };

            if (typeof success === 'function') {
                module.exports.conform(success());
            }
            else if (typeof error === 'function') {
                module.exports.conform(null, error());
            }

            if (arguments.length === 1 && !isFunc(arguments[0])) {//must be expecting a promise and are passing in an object param
                return new Promise((resolve, reject) => {
                    if (success) {
                        process.nextTick(resolve, success);
                    }
                    else if (typeof queriableData !== 'undefined') {
                        process.nextTick(resolve, module.exports.queryData(queriableData, arguments[0]));
                    }
                    else {
                        process.nextTick(reject, error);
                    }
                });
            }
            else if (arguments.length === 1 && isFunc(arguments[0])) {//must be passing in a singleton 'nodejs' error first callback
                if (success) {
                    process.nextTick(arguments[0], null, success);
                }
                else {
                    process.nextTick(arguments[0], error);
                }
            }
            else if (arguments.length === 2 && !isFunc(arguments[0]) && isFunc(arguments[1])) {//you must be passing in a param obj, as well as a error first callback
                if (success) {
                    process.nextTick(arguments[1], null, success);
                }
                else if (queriableData[arguments[0]]) {
                    process.nextTick(arguments[1], null, queriableData[arguments[0]]);
                }
                else {
                    process.nextTick(arguments[1], error);
                }
            }
            else if (arguments.length === 2 && isFunc(arguments[0]) && isFunc(arguments[1])) {//you must be passing both ok,fail callbacks
                if (success) {
                    process.nextTick(arguments[0], success);
                }
                else {
                    process.nextTick(arguments[1], error);
                }
            }
            else if ((arguments.length > 2) && !isFunc(arguments[0]) && isFunc(arguments[1]) && isFunc(arguments[2])) {// ok and fail as well as a object param
                if (success) {
                    process.nextTick(arguments[1], success);
                }
                else if (queriableData && queriableData[arguments[0]]) {
                    process.nextTick(arguments[1], queriableData[arguments[0]]);
                }
                else {
                    process.nextTick(arguments[2], error);
                }
            }
            else {// length === 0 or some other situation
                return new Promise((resolve, reject) => {
                    if (success) {
                        process.nextTick(resolve, success);
                    }
                    else if (queriableData) {
                        process.nextTick(reject, queriableData);
                    }
                    else {
                        process.nextTick(reject, error);
                    }
                });
            }
        };
    },

    /**
     * Asynchronizes sync functions and standalone values turning them into a
     *  err first callback or a ok/fail callback pair, or a promise
     *
     * @param value
     * @param args
     * @returns {Function}
     */
    async: function (value, args) {

        return function callbackable(ok, fail) {

            return new Promise((resolve, reject) => {
                let aok = module.exports.spreader(ok, resolve);
                let nope = module.exports.spreader(fail, reject);
                if (typeof value === 'function') {
                    try {
                        process.nextTick(aok, value.apply(self, args));
                    }
                    catch (e) {
                        if(typeof fail !== 'function' && typeof ok === 'function') {
                            process.nextTick(ok, null, e);
                            process.nextTick(reject, e);
                        }
                        else {
                            process.nextTick(nope, e);
                        }
                    }
                    return;
                }
                else if(typeof value === 'undefined'){//error condition
                    //incases were the client wants to user error first callbacks
                    if(typeof fail !== 'function' && typeof ok === 'function') {
                        process.nextTick(ok, null, args);
                        process.nextTick(reject, args);
                    }
                    else {
                        process.nextTick(nope, args);
                    }
                    return;
                }
                aok(value);
            });
        };

    }
};