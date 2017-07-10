/**
 * Created by daniel.irwin on 6/17/17.
 */

let arupex = require('../arupex');
let logger = new arupex.lib.logger('Demo');

let interceptors = arupex.interceptors;

if(process.env.server) {
    interceptors.http.start(1234, {
        dir: __dirname,
        routes : require('./routes')
    });
}
else {
    let lambdas = interceptors.lambdas({
        dir: __dirname,
        routes : {},//useful if you want to expose swagger via the lambda
        // disableTracer : true,
        meterFnc : function meterFinish(meter){
            logger.info('meter', meter);
        },
        traceFnc : function traceFinish(type, traceName, value, other, traceRoute){
            logger.info('trace', type, traceName, value, other, traceRoute);
        }
    });

    //lets execute our lambda for this demo (normally you would module.handler = lambdas;)//or the specific lambda
    lambdas.userCurrency({
        currency: 'USD'
    }, {
        mockData : process.env.MOCK?{
            //UserDataService is not overrideable so putting anything here will accomplish nothing
            CurrencyDataService : {
                getLatestBase : {
                    data : { MOCK : true }
                }
            }
        }:undefined
    }, function(err, data) {
        logger.info('data', data);
        process.exit(0);
    });
}