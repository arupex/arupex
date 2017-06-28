/**
 * Created by daniel.irwin on 5/24/17.
 */
module.exports = {

    swaggerRoute : function(method, path, pathParams, query, headers){

        let swaggerRoute = {};

        let pathSanity = path.replace(/{{(\w+)}}/g, '{$1}');//single mustache not double

        swaggerRoute[pathSanity] = {};
        let methodName = method.toLowerCase();
        swaggerRoute[pathSanity][methodName] = {};
        swaggerRoute[pathSanity][methodName].description = 'Dumby';
        swaggerRoute[pathSanity][methodName].responses = { '200' : {} };

        function param(type) {
            return function (acc, v) {
               acc.push({
                    name: v.replace(/{{(\w+)}}/, '$1'),
                    'in': type,
                    required : !!v.match(/{{\w+}}/) || (type==='path'),
                    description: v,
                    type: 'string'
                });
                return acc;
            };
        }

            let paths   = pathParams.reduce(param('path'), []);
            let queries = (Object.keys(query).map(e => query[e]).reduce(param('query'), []));
            let headerz = (headers).reduce(param('header'), []);


        swaggerRoute[pathSanity][methodName].parameters = paths.concat(queries).concat(headerz);

        return swaggerRoute;

    },

    swagger : function(decompiledroutes, opts){
        let doc = {
            "swagger": "2.0",
            "info": {
                "title": opts.title || 'Swagger Doc',
                "version": opts.version || 1.0
            },
            "tags": opts.tags || [],
            "definitions": opts.definitions || {
                "contact": {"properties": {}},
                "group": {"properties": {}}
            },
            "paths": {}
        };

        return decompiledroutes.reduce((acc, route) => {
            // console.log('route', route);
            let router = this.swaggerRoute(route.method, route.path, route.pathParams, route.query, opts.headers);

            let routeName = Object.keys(router)[0];
            acc.paths[routeName] = router[routeName];
            return acc;
        }, doc);
    },

    generateFromUrls : function(urls, opts){
        let decompiledRoute = require('./routeAnalyzer').decompileRoute;

        return this.swagger(urls.map(decompiledRoute), opts);
    }

};