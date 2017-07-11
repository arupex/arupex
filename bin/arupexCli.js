#!/usr/bin/env node
let arupex = require('../arupex');
if(process.argv[2]){

    switch(process.argv[2]){
        case 'schema':
            let value = arupex.interceptors.lambdas({
                meterFnc : () => {},
                traceFnc : () => {},
                dir : process.cwd(),
                edge : true
            }).mockGenerator;
            delete value.fncVarReplacements;
            console.log('Mock Schema is as Follows: \n\n', JSON.stringify(value, null, 3));
            break;

        case 'invoke':

            let context = process.argv[5]?JSON.parse(require('fs').readFileSync(process.argv[5], 'utf8'):{};
            let event = JSON.parse(require('fs').readFileSync(process.argv[4], 'utf8'));

            arupex.interceptors.lambda[process.argv[3]](event, context, (err, data)=> {
                if(err){
                    console.log('err', err);
                }
                else {
                    console.log('Responded with', data);
                }
            });
            break;

        case 'server':
            arupex.interceptors.http.start(process.env.PORT || 1337, {
                dir: process.cwd()
            });
            break;
        case 'mock':
            arupex.interceptors.mockServer(process.env.PORT || 1337, {
                dir : process.cwd()
            });
            
            break;

        default: //you entered an invalid arg 2
            console.log(`USAGE:\n
                arupex schema                           # outputs the mock schema for your app
                arupex invoke event.json context.json   # invokes your lambda via a parameterized event.json and an optional context json
                arupex server                           # runs your lambdas as a server on port 1337 based on your routes.js file
                arupex mock                             # runs a mock server for your lambda with a harness page at localhost:1337
            `);
    }

}
else {
    arupex.interceptors.http.start(process.env.PORT || 1337, {
        dir: process.cwd()
    });
}
