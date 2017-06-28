/**
 * Created by daniel.irwin on 6/17/17.
 */
require('../interceptors/lambdInterceptor')({
    dir : __dirname
}).userCurrency({

}, {

}, (err, data, res) => {
    console.log('err', err, 'data', data, 'res', res);
});