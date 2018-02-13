/**
 * Created by daniel.irwin on 6/25/17.
 */
'use strict';
module.exports = function Pipeline(opts, tasks){
    const DEFAULT_TIMEOUT = 30000;
    const logger = require('./logger');
    const LOG = new logger('Arupex-Pipeline');

    return function go(context, responses, final) {
        let timeout = null;

        let clearResponses = Object.keys(responses).reduce((acc, key) => {
            acc[key] =  function cR(){
                if(timeout){
                    clearTimeout(timeout);
                }
                responses[key].apply(this, arguments);
            };
            return acc;
        }, {});

        function nextPlugin() {

            if(timeout){
                clearTimeout(timeout);
            }

            let task = tasks.shift();
            if (!task) {
                final(context);
            }
            else if (task && typeof task === 'function') {
                if(opts.timeout){
                    timeout = setTimeout(function timedOut(){
                        LOG.warn('your middleware appears to be taking its time', task);
                        if(opts.timeout) {
                            if (typeof opts.timeoutFnc !== 'function') {
                                if (opts.continueOnTimeout) {
                                    nextPlugin();
                                }
                                else {
                                    final(context);
                                }
                            }
                            else {
                                opts.timeoutFnc(context, responses);
                            }
                        }
                    }, opts.timeout || DEFAULT_TIMEOUT);
                }
                task(context, clearResponses, nextPlugin);
            }
        }

        nextPlugin();
    };

};