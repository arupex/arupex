/**
 * Created by daniel.irwin on 6/17/17.
 */

let arupex = require('../arupex'||'arupex');
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
            if(process.env.DEBUG){
                logger.info('meter', meter);
            }
        },
        traceFnc : function traceFinish(type, traceName, value, other, traceRoute){
            if(process.env.DEBUG){
                logger.info('trace', type, traceName, value, other, traceRoute);
            }
        },
        mockContext : function(event, context){
            return context.mockData;//this is where ive decided to store my mock data when invoked, could be on headers or what ever you please!
        },
        // edge : true
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
        console.log(JSON.stringify(data, null, 3));
        process.exit(0);//have to use exit here if we dont want the lambda to continue running because of the worker we have
    });
}