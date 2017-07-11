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
        case 'mock':

            arupex.interceptors.mockServer.start(process.env.PORT || 1337, {
                dir : process.cwd()
            });
            
            break;

        default:
    }

}
else {
    arupex.interceptors.http.start(process.env.PORT || 1337, {
        dir: process.cwd()
    });
}
