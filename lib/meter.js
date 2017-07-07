/**
 * Created by daniel.irwin on 6/25/17.
 */
'use strict';
module.exports = function (meterFinish) {
    if (typeof meterFinish !== 'function') {
        process.emit('error', 'meter(meterFinish) where meterFinish is required to be typeof function');
        //incase you forget a callback we will fail gracefully
        return function () {
            return {
                end: function () {}
            };
        };
    }

    return function meter(name) {

        let start = process.hrtime();
        return {
            end: function () {
                let end = process.hrtime(start);
                process.nextTick(meterFinish, {
                    name: name,
                    time: ((end[0] * 1e9 + end[1])/1000000)// nanoseconds if you want millis * 1e-6
                });
            }
        };
    };

};