/**
 * Created by daniel.irwin on 6/27/17.
 */
module.exports = function (meterCallback, traceCallback, auditor) {

    let logger = require('./logger');
    let LOG = new logger('Metric_Tracer', auditor);
    let tracer = require('./trace');
    let meter = require('./meter')(meterCallback || function (meter){
        LOG.info('meter', meter);
    });

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

        return tracer(traceCallback || function (type, traceName, value, other, traceRoute){
            LOG.info('trace', type, traceName, value, other, traceRoute);
        }, true, metricify(name))(fnc);

    };

};