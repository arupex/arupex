/**
 * Created by daniel.irwin on 6/25/17.
 */
'use strict';
class MeterFactory {

    constructor (meterFinish) {
        if (typeof meterFinish !== 'function') {
            process.stderr.write('meter(meterFinish) where meterFinish is required to be typeof function');
        }
        this._meterFunc = meterFinish;
    }

    meter(name) {

        let start = process.hrtime();
        return {
            end: function () {
                let end = process.hrtime(start);
                process.nextTick(this._meterFunc, 'meter', {
                    name: name,
                    time: ((end[0] * 1e9 + end[1])/1000000)// nanoseconds if you want millis * 1e-6
                });
            }
        };
    };

}

module.exports = MeterFactory;