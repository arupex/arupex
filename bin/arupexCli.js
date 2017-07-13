#!/usr/bin/env node
let arupex = require('../arupex');
let fs = require('fs');
let dir = process.cwd();
let cmd = process.argv[2];
let port = process.env.PORT || 1337;
let functionName = process.argv[3];
let watch = process.argv.indexOf('watch') !== -1;
let server = null;
let appCreator = require('./appCreator');
let logger = new arupex.lib.logger('CLI-Logger');

function ignoreEmpty(value, label){
    return (typeof value!=='undefined'?`${label?label:''} ${value}`:'');
}

function run() {
    let context = process.argv[5] ? JSON.parse(fs.readFileSync(process.argv[5], 'utf8')) : {};
    let name = process.argv[4];
    let event =  name ? JSON.parse(fs.readFileSync(name, 'utf8')) : {};


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
                return;

            case 'invoke':
                server = arupex.interceptors.lambda[functionName](event, context, (err, data) => {
                    if (err) {
                        console.log('err', err);
                    }
                    else {
                        console.log('Responded with', data);
                    }
                });
                return;

            case 'server':
                server = arupex.interceptors.http.start(port, {
                    dir: dir
                });
                return;
            case 'mock':
                server = arupex.interceptors.mockServer(port, {
                    dir: dir,
                    meterFnc : function meterFinish(meter){
                        logger.info('meter', meter);
                    },
                    traceFnc : function traceFinish(type, traceName, value, other, traceRoute){
                        let padStr = '                        ';
                        let idealPad = 28;
                        logger.info('trace\t', type,
                            '\t', traceName.padEnd(idealPad, padStr),
                            '\t', ignoreEmpty(value).padEnd(idealPad, padStr),
                            ignoreEmpty(other, 'was').padEnd(idealPad, padStr),
                            '\t', traceRoute);
                    },
                });
                return;

            case 'create':
                let appNameOrSub = process.argv[3];
                if(name) {
                    switch (appNameOrSub.toLowerCase()) {
                        case 'dataservice':
                            return appCreator.createDataService(dir, name);
                            case 'util':
                        return appCreator.createDataServiceUtil(dir, name);
                        case 'policy':
                            return appCreator.createPolicy(dir, name);
                        case 'service':
                            return appCreator.createService(dir, name);
                        case 'response':
                            return appCreator.createResponse(dir, name);
                        case 'function':
                            return appCreator.createFunction(dir, name);
                        case 'hook':
                            return appCreator.createHook(dir, name);
                        case 'worker':
                            return appCreator.createWorker(dir, name);
                        case 'app':
                            return appCreator.createApp(dir, name);
                        default:
                        //create App
                            return appCreator.createApp(dir, appNameOrSub);
                    }
                    return;
                }
        }
        //you entered an invalid arg 2
        console.log(`USAGE:\n
                arupex schema                           # outputs the mock schema for your app
                arupex invoke event.json context.json   # invokes your lambda via a parameterized event.json and an optional context json
                arupex server                           # runs your lambdas as a server on port 1337 based on your routes.js file
                arupex mock                             # runs a mock server for your lambda with a harness page at localhost:1337
            `);
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
            server.close(() => {
                Object.keys(require.cache).forEach((key) => {
                    delete require.cache[key];
                });//remove data from requires cache as it will just reload old files if we dont
                run();
            });
        }
        else {
            console.log('server is not running');
        }
    });
}