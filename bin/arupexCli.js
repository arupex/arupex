#!/usr/bin/env node
let arupex = require('../arupex');
let fs = require('fs');
let dir = process.cwd();
let cmd = process.argv[2];
let port = process.env.PORT || 1337;
let functionName = process.argv[3];
let watch = process.argv.indexOf('watch') !== -1;
let server = null;

function run() {
    let context = process.argv[5] ? JSON.parse(fs.readFileSync(process.argv[5], 'utf8')) : {};
    let event =  process.argv[4] ? JSON.parse(fs.readFileSync(process.argv[4], 'utf8')) : {};


    if (cmd) {

        switch (cmd) {
            case 'schema':
                let value = arupex.interceptors.lambdas({
                    meterFnc: () => {},
                    traceFnc: () => {},
                    dir: dir,
                    edge: true
                }).mockGenerator;
                delete value.fncVarReplacements;
                console.log('Mock Schema is as Follows: \n\n', JSON.stringify(value, null, 3));
                break;

            case 'invoke':
                server = arupex.interceptors.lambda[functionName](event, context, (err, data) => {
                    if (err) {
                        console.log('err', err);
                    }
                    else {
                        console.log('Responded with', data);
                    }
                });
                break;

            case 'server':
                server = arupex.interceptors.http.start(port, {
                    dir: dir
                });
                break;
            case 'mock':
                server = arupex.interceptors.mockServer(port, {
                    dir: dir
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
        server = arupex.interceptors.http.start(port, {
            dir: dir
        });
    }
}

run();

if(watch){
    fs.watch(dir, {
        recursive: true
    }, (evt, file) => {
        console.log('saw file change', file);
        if(server && typeof server.close === 'function'){
            server.close(run);
        }
        else {
            console.log('server is not running');
        }
    });
}