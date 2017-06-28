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