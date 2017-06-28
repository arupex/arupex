/**
 * Created by daniel.irwin on 6/25/17.
 */
'use strict';
module.exports = function Pipeline(opts, tasks){

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
                        if(opts.continueOnTimeout) {
                            nextPlugin();
                        }
                        else {
                            final(context);
                        }
                    }, opts.timeout);
                }
                task(context, clearResponses, nextPlugin);
            }
        }

        nextPlugin();
    };

};