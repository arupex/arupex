/**
 * Created by daniel.irwin on 7/13/17.
 */
module.exports = (function () {
    let fs = require('fs');
    let spawn = require('child_process');
    let arupexPackage = require('../package.json');
    function createFile(folder, filename, content) {
        try {
            fs.writeFileSync(`${folder}/${filename}`, content, 'utf8');
            console.log('\twrote', folder, filename);
        }
        catch(e){
            console.log('failed to create file', folder, filename);
        }
    }

    function createDir(path, dirName) {
        try {
            fs.mkdirSync(`${path}/${dirName}`);
            console.log('\ncreated', path, dirName);

        }
        catch(e){
            console.log('\nfailed to create directory', path, dirName);
        }
    }


    function createApp(dir, name) {
        let appJS = `'use strict';
var arupex = require('arupex');
var logger = new arupex.lib.logger('${name}');

var interceptors = arupex.interceptors;

function ignoreEmpty(value, label){
    return (typeof value!=='undefined'?(label?label:'') + value:'');
}

exports.handler = interceptors.lambdas({
    dir: __dirname,
    routes : require('./routes'),//useful if you want to expose swagger via the lambda
    meterFnc : function meterFinish(meter){
        logger.info('meter', meter);
    },
    traceFnc : function traceFinish(type, traceName, value, other, traceRoute){
        var padStr = '                        ';
        var idealPad = 28;
        logger.info('trace\t', type,
            '\t', traceName.padEnd(idealPad, padStr),
            '\t', ignoreEmpty(value).padEnd(idealPad, padStr),
            ignoreEmpty(other, 'was').padEnd(idealPad, padStr),
            '\t', traceRoute);
    },
    mockContext : function(event, context){
        if(typeof event.headers.mockData === 'string') {
            return JSON.stringify(context.headers.mockData);
        }
        return null;
    }
});`;

        //main app directory
        createDir(dir, name);
        let appsDir = `${dir}/${name}`;
        createFile(appsDir, 'app.js', appJS);
        let hyperRequestVersion = arupexPackage.dependencies['hyper-request'];
        createFile(`${appsDir}`, 'package.json', `{
  "name": "${name}",
  "version": "0.0.1",
  "description": "",
  "main": "app.js",
  "scripts": {
    "test": "./node_modules/arupex/bin/arupexCli.js mock"
  },
  "author": "",
  "license": "UNLICENSED",
  "dependencies": {
    "hyper-request": "${hyperRequestVersion}",
    "arupex" : "${arupexPackage.version}"
  },
  "devDependencies": {}
}
`);

        //services/hooks/utils/etc
        createDir(appsDir, `DataServices`);
        createDataService(appsDir, name);

        createDir(appsDir, `DataServiceUtils`);
        createDataServiceUtil(appsDir, name);

        createDir(appsDir, `Environments`);
        createFile(`${appsDir}/Environments`, 'dev.js', `module.exports = {  \n\n   ${name}DataService : {\n\n   }\n};`);

        createDir(appsDir, `Functions`);
        createFunction(appsDir, name);

        createDir(appsDir, `Hooks`);
        createHook(appsDir, name);

        createDir(appsDir, `Responses`);
        createResponse(appsDir, name);

        createDir(appsDir, `Services`);
        createService(appsDir, name);

        createDir(appsDir, `Policies`);
        createPolicy(appsDir, name);

        createDir(appsDir, `Workers`);
        createWorker(appsDir, name);

        console.log('running npm install');
        spawn.spawnSync('npm', ['install'], {
            cwd : appsDir
        });

    }

    function createDataService(appsDir , name) {
        createFile(`${appsDir}/DataServices`, `${name}DataService.js`, `module.exports = [\n\n   { endpoint1 : '' },\n\n   { endpoint2 : '' }\n\n];`);
    }

    function createDataServiceUtil(appsDir, name) {
        createFile(`${appsDir}/DataServiceUtils`,  `${name}DataServiceUtil.js`, `module.exports = function(${name}DataService) {\n\n   return {\n\n   };\n\n};`);
    }

    function createPolicy(appsDir, name) {
        createFile(`${appsDir}/Policies`,  `${name}.js`, `module.exports = function(event, context, next, res) { \n\n};`);
    }

    function createResponse(appsDir, name) {
        createFile(`${appsDir}/Responses`,  `${name}.js`, `module.exports = function(data, callback) { \n\n};`);
    }

    function createService(appsDir, name) {
        createFile(`${appsDir}/Services`,  `${name}Service.js`, `module.exports = function(${name}DataService) { \n\n   return {\n\n   };\n\n};`);
    }

    function createHook(appsDir, name) {
        createFile(`${appsDir}/Hooks`,  `${name}Hook.js`, `module.exports = function(event, content) { \n\n   return {\n\n   };\n\n};`);
    }

    function createFunction(appsDir, name) {
        createFile(`${appsDir}/Functions`,  `${name}.js`, `module.exports = function(${name}Service) { \n \n};`);
    }

    function createWorker(appsDir, name) {
        createFile(`${appsDir}/Workers`,  `${name}Worker.js`, `module.exports = function(){ \n\n};\n\nmodule.exports.interval = 6000;`);
    }

    return {
        createApp: createApp,
        createDataService: createDataService,
        createDataServiceUtil: createDataServiceUtil,
        createPolicy: createPolicy,
        createResponse: createResponse,
        createService: createService,
        createHook: createHook,
        createFunction: createFunction,
        createWorker: createWorker
    };

})();