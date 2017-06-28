/**
 * Created by daniel.irwin on 6/27/17.
 */
module.exports = function (meterCallback, traceCallback) {

    let tracer = require('./trace')(traceCallback, false);
    let meter = require('./meter')(meterCallback);

    return function traceMetrics(fnc, name) {

        return function() {
            let m = meter(name);
            let fncResult = tracer(fnc());
            if (fncResult) {
                return fncResult.then ? fncResult.then((data) => {
                    m.end();
                    return data;
                }) : (() => {
                    m.end();
                    return fncResult;
                })();
            }
            m.end();
        };
    };

};