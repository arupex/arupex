/**
 * Created by daniel.irwin on 7/13/17.
 */
module.exports = (function () {
    let fs = require('fs');

    function createFile(folder, filename, content) {
        fs.writeFileSync(`${folder}/${filename}`, content, 'utf8');
    }

    function createDir(path, dirName) {
        fs.mkdirSync(`${path}/${dirName}`);
    }

    let dir = process.cwd();

    function createApp(name) {
        let appJS = `'use strict';
            let arupex = require('arupex');
            let logger = new arupex.lib.logger('${name}');
            
            let interceptors = arupex.interceptors;
            
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
                    let padStr = '                        ';
                    let idealPad = 28;
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

        //services/hooks/utils/etc
        createDir(dir, `DataServices`);
        createDataService(appsDir, name);

        createDir(appsDir, `DataServiceUtils`);
        createDataService(appsDir, name);

        createDir(appsDir, `Environments`);
        createFile(`${appsDir}/Environments`, 'dev.js', `module.exports = {  '${name}' : {\n} };`);

        createDir(appsDir, `Functions`);
        createFunction(appsDir, name);

        createDir(appsDir, `Hooks`);
        createHook(appsDir, name);

        createDir(appsDir, `Responses`);
        createResponse(appsDir, name);

        createDir(appsDir, `Services`);
        createService(appsDir, name);

    }

    function createDataService(appsDir , name) {
        createFile(`${appsDir}/DataServices`, `${name}.js`, `module.exports = [\n]`);
    }

    function createDataServiceUtil(appsDir, name) {
        createFile(`${appsDir}/DataServiceUtils`,  `${name}DataService.js`, `module.exports = function(event, content) { \n };`);
    }

    function createPolicy(appsDir, name) {
        createFile(`${appsDir}/Policies`,  `${name}.js`, `module.exports = function(event, content) { \n };`);
    }

    function createResponse(appsDir, name) {
        createFile(`${appsDir}/Responses`,  `${name}.js`, `module.exports = function(data, callback) { \n };`);
    }

    function createService(appsDir, name) {
        createFile(`${appsDir}/Services`,  `${name}Service.js`, `module.exports = function(${name}DataService) { \n };`);
    }

    function createHook(appsDir, name) {
        createFile(`${appsDir}/Hooks`,  `${name}Hook.js`, `module.exports = function(event, content){ \n  };`);
    }

    function createFunction(appsDir, name) {
        createFile(`${appsDir}/Functions`,  `${name}.js`, `module.exports = function(${name}Service) { \n }`);
    }

    function createWorker(appsDir, name) {
        createFile(`${appsDir}/Workers`,  `${name}Worker.js`, `module.exports = function(){ \n };`);
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