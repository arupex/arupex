/**
 * Created by daniel.irwin on 5/24/17.
 */
'use strict';
module.exports = function ClientBuilder (calls, injectables) {

    let methods = ['GET','POST','DELETE','PATCH','PUT'];
    let Url = require('url');
    let injector = require('./injector');
    let logger = require('./logger');
    let log = new logger('ArupexClient');

    function uppercaseFirstLetter(match) {
        return match[1].toUpperCase();
    }
    function parseCallString(input){
        let callString;
        let name;
        if(typeof input === 'object'){
            name = Object.keys(input)[0];
            if(typeof input[name] === 'string') {
                callString = input[name];
            }
            else if(typeof input[name] === 'function'){
                callString = injector(injectables, input[name]);
            }
            else {
                return;//umm, fail gracefully
            }
        }
        else {
            callString = input;
        }

        let method = 'GET';

        let pieces = callString.split(' ');

        let fullUrl = callString;
        if(pieces.length > 1){
            fullUrl = pieces[1];

            if(methods.indexOf(pieces[0].toUpperCase())>-1){
                method = pieces[0].toUpperCase();
            }
        }

        let parsedUrl = Url.parse(fullUrl.replace(/({{.*}})/g, function(match){
            return 'With' + match[2].toUpperCase() + match.substring(3, match.length-2);
        }));

        let queries = [];

        if(parsedUrl.query) {
            queries = parsedUrl.query.split('&');
        }

        if(!name) {
            name = parsedUrl.pathname || 'named';

            if (parsedUrl.pathname) {

                name = (method.toLowerCase() + '/' + decodeURIComponent(parsedUrl.pathname))
                    .replace(/(-\w)/g, uppercaseFirstLetter)
                    .replace(/(_\w)/g, uppercaseFirstLetter)
                    .replace(/(\/\w)/g, uppercaseFirstLetter)
                    .replace(/[{}]/g, '');

                if (queries) {
                    queries.forEach(query => {
                        let q = query.split('=')[0];
                        name += 'By' + q[0].toUpperCase() + q.substring(1);
                    });
                }
            }
        }

        return {
            method : method,
            name : name,
            queries : queries,
            fullPath : fullUrl
        };
    }

    calls = calls.map((a) => parseCallString(a)).sort((a, b) => a.name.localeCompare(b.name));

    let client = {};

    client.init = function (restOpts, debug){
        let HyperRequest = require('hyper-request');
        this.log = restOpts.logger || {
            info : () => {  },
            critical : () => {  }
        };

        this.restClient = new HyperRequest(restOpts);
        this.interpolate = function (str) {
            let log = this.log;
            return function interpolate(o) {
                if(!o){
                    log.critical(`${str} could not be evaluated with falsey interpolation input`);
                    return str;
                }
                return str.replace(new RegExp('{{([^{}]+)}}', 'g'),  (a, b) => {
                    if(!o[b]) {
                        log.critical(`${str} could not be evaluated with missing key ${b} during interpolation`);
                    }
                    return o[b];
                });
            };
        };
        this.debug = debug;
        this.initialized = true;
        return this;
    };

    client.fncVarReplacements = {};

    calls.forEach( c => {

        if(!client.fncVarReplacements[c.name]){
            client.fncVarReplacements[c.name] = {};
        }

        client.fncVarReplacements[c.name]['c.method.toLowerCase()'] = c.method.toLowerCase();
        client.fncVarReplacements[c.name]['c.fullPath'] = c.fullPath;

        client[c.name] = function (opts, ok, fail) {
            if(!this.initialized){
                this.init(opts);
            }
            let url = this.interpolate(c.fullPath)(opts);
            this.log.info(`hitting ${url}`);
            return this.restClient[c.method.toLowerCase()](url, opts, ok, fail);
        };

    });

    return client;

};