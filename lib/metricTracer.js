/**
 * Created by daniel.irwin on 6/27/17.
 */
const MeterFactory = require('./MeterFactory');
const Tracer = require('./Tracer');

class MetricTracer {

    constructor(auditor, logger) {
        this._LOG = new logger('Metric_Tracer', auditor);

        this._auditor = typeof auditor === 'function' ? auditor : () => {};

        this._meter = MeterFactory(auditor);
    }

    traceMetrics(fnc, name) {

        let metricify = () => {
            let myMeter = null;
            return (phase, name) => {
                if (phase === 'start') {
                    myMeter = this._meter(name);
                }
                else if (phase === 'completed' && myMeter) {
                    myMeter.end();
                }
            };
        };

        return new Tracer({
            audit: (type, traceName, value, other, traceRoute) => {
                this._LOG.info('trace', type, traceName, value, other, traceRoute);
            },
            observer: metricify(name)
        }).trace(fnc);
    }

}

module.exports = MetricTracer;