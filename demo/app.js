/**
 * Created by daniel.irwin on 6/17/17.
 */
let start = process.hrtime();

//this is synchronous
let interceptors = require('../arupex').interceptors;

if(process.env.server) {
    interceptors.http.start(1234, {
        dir: __dirname
    });
}
else {
    let lambdas = interceptors.lambdas({
        dir: __dirname
    });
    let end = process.hrtime(start);
    console.log('boot time was', (end[0] * 1e9 + end[1]) / 1000000, 'ms');

//lets execute our lambda for this demo (normally you would module.handler = lambdas;)
    let start2 = process.hrtime();

    lambdas.userCurrency({
        currency: 'USD'
    }, {}, (err, data, res) => {
        let end2 = process.hrtime(start2);
        console.log('run time was', (end2[0] * 1e9 + end2[1]) / 1000000, 'ms');

        console.log('err', err, 'data', data, 'res', res);

    });
}