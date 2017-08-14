#!/usr/bin/env node
let arupex = require('../arupex');
let fs = require('fs');
let dir = process.cwd();
let cmd = process.argv[2];
let port = process.env.PORT || 1337;
let functionName = process.argv[3];
let watch = process.argv.indexOf('watch') !== -1;
let disableTrace = process.argv.indexOf('disableTrace') !== -1;
let server = null;
let appCreator = require('./appCreator');
let logger = new arupex.lib.logger('CLI-Logger');

function ignoreEmpty(value, label){
    return (typeof value!=='undefined'?`${label?label:''} ${value}`:'');
}
function sampleEvent(dir){
    try {
        return JSON.parse(fs.readFileSync(`${dir}/event.json`, 'utf8'));
    }
    catch(e){
        return {};
    }
}
function run() {
    let name = process.argv[4];


    if (cmd) {

        switch (cmd) {
            case 'schema':
                let value = arupex.interceptors.lambdas({
                    disableTracer : disableTrace,
                    meterFnc: () => {},
                    traceFnc: () => {},
                    dir: dir,
                    edge: true
                }).mockGenerator;
                delete value.fncVarReplacements;
                console.log('Mock Schema is as Follows: \n\n', JSON.stringify(value, null, 3));
                return;

            case 'invoke':
                let event =  name ? JSON.parse(fs.readFileSync(name, 'utf8')) : {};
                let context = process.argv[5] ? JSON.parse(fs.readFileSync(process.argv[5], 'utf8')) : {};
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
                    disableTracer : disableTrace,
                    dir: dir,
                    meterFnc : () => {},
                    traceFnc : () => {}
                });
                return;
            case 'mock':
                console.log(`Running Mock Server on port : ${port}`);
                server = arupex.interceptors.mockServer(port, {
                    disableTracer : disableTrace,
                    dir: dir,
                    meterFnc : function meterFinish(meter){
                        logger.info('meter', meter);
                    },
                    traceFnc : function traceFinish(type, traceName, value, other, traceRoute){
                        logger.info('trace\t', type,
                            '\t', traceName,
                            '\t', ignoreEmpty(value),
                            ignoreEmpty(other, 'was'),
                            '\t', traceRoute);
                    },
                }, { sampleEvent : sampleEvent(dir)});
                return;

            case 'create':
                let appNameOrSub = process.argv[3];
                let packageName = process.argv[4];
                console.log('cmd', appNameOrSub);
                if(appNameOrSub) {
                    switch (appNameOrSub.toLowerCase()) {
                        case 'dataservice':
                            return appCreator.createDataService(dir, packageName);
                            case 'util':
                        return appCreator.createDataServiceUtil(dir, packageName);
                        case 'policy':
                            return appCreator.createPolicy(dir, packageName);
                        case 'service':
                            return appCreator.createService(dir, packageName);
                        case 'response':
                            return appCreator.createResponse(dir, packageName);
                        case 'function':
                            return appCreator.createFunction(dir, packageName);
                        case 'hook':
                            return appCreator.createHook(dir, packageName);
                        case 'worker':
                            return appCreator.createWorker(dir, packageName);
                        case 'app':
                            return appCreator.createApp(dir, packageName);
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
            dir: dir,
            meterFnc: () => {},
            traceFnc: () => {}
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