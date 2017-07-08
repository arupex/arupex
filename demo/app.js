/**
 * Created by daniel.irwin on 6/17/17.
 */
let start = process.hrtime();

//this is synchronous
let arupex = require('../arupex');
let logger = new arupex.lib.logger('Demo');

let interceptors = arupex.interceptors;

if(process.env.server) {
    interceptors.http.start(1234, {
        dir: __dirname
    });
}
else {
    let lambdas = interceptors.lambdas({
        dir: __dirname,
        meterFnc : function meterFinish(meter){
            if(process.env.DEBUG) {
                logger.info('meter', meter);
            }
        },
        traceFnc : function traceFinish(type, traceName, value, other, traceRoute){
            if(process.env.DEBUG){
                logger.info('trace', type, traceName, value, other, traceRoute);
            }
        }
    });
    let end = process.hrtime(start);
    logger.info('boot time was', (end[0] * 1e9 + end[1]) / 1000000, 'ms');

    let event = {
        currency: 'USD'
    };

    let context = {
        mockData : process.env.MOCK?{
            UserDataService : {
                getOtherCurrency : {
                    data : 'CAD'
                }
            },
            CurrencyDataService : {
                getLatestBase : {
                    data : { MOCK : true }
                }
            }
        }:undefined
    };

    let start2 = process.hrtime();

    let lambdaCallback = function(err, data) {
        let end2 = process.hrtime(start2);
        logger.info('run time was', (end2[0] * 1e9 + end2[1]) / 1000000, 'ms');

        logger.info('err', err, 'data', data);
        process.exit(0);
    };

    //lets execute our lambda for this demo (normally you would module.handler = lambdas;)//or the specific lambda
    lambdas.userCurrency(event, context, lambdaCallback);
}