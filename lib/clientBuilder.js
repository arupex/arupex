/**
 * Created by daniel.irwin on 5/24/17.
 */
'use strict';

module.exports = function ClientBuilder (calls, injectables, injector) {

    const methods = ['GET','POST','DELETE','PATCH','PUT'];
    let Url = require('url');

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

    client._init = function (restOpts, debug){
        let HyperRequest = require('hyper-request');
        this._log = restOpts.logger || {
            info : () => {  },
            critical : () => {  }
        };

        this._restClient = new HyperRequest(restOpts);

        this._interpolate = function (str) {
            return (o) => {
                if(!o){
                    this._log.critical(`${str} could not be evaluated with falsey interpolation input`);
                    return str;
                }
                return str.replace(new RegExp('{{([^{}]+)}}', 'g'),  (a, b) => {
                    if(typeof o[b] !== 'boolean' && !o[b]) {
                        this._log.critical(`${str} could not be evaluated with missing key ${b} during interpolation`);
                    }
                    return o[b];
                });
            };
        };
        this._debug = debug;
        this._initialized = true;
        return this;
    };

    client._clearInternalCache = function(){
        this._restClient.clearCache();
    };

    client._setLogger = function(logger){
        this._log = logger;
    };

    client._fncVarReplacements = {};

    client.subClient = ({audit, logger = this._log }) => {
        let sub = {
            _restClient : this._restClient.child({ audit : audit }),
            _interpolate : this._interpolate,
            _log : logger
        };
        addCallsToClient(sub);
    };

    function addCallsToClient(client) {
        calls.forEach( c => {

            if(!client._fncVarReplacements[c.name]){
                client._fncVarReplacements[c.name] = {};
            }

            client._fncVarReplacements[c.name]['c.method.toLowerCase()'] = c.method.toLowerCase();
            client._fncVarReplacements[c.name]['c.fullPath'] = c.fullPath;

            client[c.name] = function (opts, ok, fail) {
                if(!this.initialized){
                    this._init(opts);
                }
                let url = '';

                if(!opts.params || typeof opts.params !== 'object') {
                    this._log.critical(`Putting Params at the root of Request Options object is deprecated and will be removed in a future release,`);
                    this._log.critical(`please put your params in Options in a params : { someParam : 'someValue' } , key/value`);
                    url = this._interpolate(c.fullPath)(opts);
                }
                else {
                    url = this._interpolate(c.fullPath)(opts.params);
                }

                this._log.info(`hitting ${url}`);
                return this._restClient[c.method.toLowerCase()](url, opts, ok, fail);
            };

        });

    }

    addCallsToClient(client);

    return client;

};