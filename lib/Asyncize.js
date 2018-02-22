/**
 * Created by daniel.irwin on 6/20/17.
 */
class Asyncize {

    /**
     * Spreader allws you to associate multiple functions with 1 call
     * ie, let i = spreader(ok, success, next, good, finally);
     * i('yup') // calls ok, success, next, good, finally all with 'yup'
     * @returns {result}
     */
    static spreader () {
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
    }

    static queryData (data, query) {
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
    }

    static conform (success, error, queriableData) {
        return function inCall() {
            let isFunc = function (p) {
                return typeof p === 'function';
            };

            if (typeof success === 'function') {
                Asyncize.conform(success());
            }
            else if (typeof error === 'function') {
                Asyncize.conform(null, error());
            }

            if (arguments.length === 1 && !isFunc(arguments[0])) {//must be expecting a promise and are passing in an object param
                return new Promise((resolve, reject) => {
                    if (success) {
                        process.nextTick(resolve, success);
                    }
                    else if (typeof queriableData !== 'undefined') {
                        let result = Asyncize.queryData(queriableData, arguments[0]);
                        if(result !== null){
                            process.nextTick(resolve, result);
                        }
                        else {
                            process.nextTick(reject, error);
                        }
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
                else if (queriableData) {
                    let result = Asyncize.queryData(queriableData, arguments[0]);

                    if(result !== null){
                        process.nextTick(arguments[1], null, result);
                    }
                    else {
                        process.nextTick(arguments[1], error);
                    }
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
                else if (queriableData) {

                    let result = Asyncize.queryData(queriableData, arguments[0]);

                    if(result !== null){
                        process.nextTick(arguments[1], Asyncize.queryData(queriableData, arguments[0]));
                    }
                    else {
                        process.nextTick(arguments[2], error);
                    }
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
    }

    /**
     * Asynchronizes sync functions and standalone values turning them into a
     *  err first callback or a ok/fail callback pair, or a promise
     *
     * @param value
     * @param args
     * @returns {Function}
     */
    static async (value, args) {

        return function callbackable(ok, fail) {

            return new Promise((resolve, reject) => {
                let aok = Asyncize.spreader(ok, resolve);
                let nope = Asyncize.spreader(fail, reject);
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
}

module.exports = Asyncize;