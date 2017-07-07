/**
 * Created by daniel.irwin on 6/27/17.
 */
module.exports = function (meterCallback, traceCallback) {

    let tracer = require('./trace');
    let meter = require('./meter')(meterCallback);

    return function traceMetrics(fnc, name) {

        function metricify(){
            let myMeter = null;
            return function(phase, name) {
                if (phase === 'start') {
                    myMeter = meter(name);
                }
                else if (phase === 'completed' && myMeter) {
                    myMeter.end();
                }
            };
        }

        return tracer(traceCallback, true, metricify(name))(fnc);

    };

};