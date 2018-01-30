/**
 * Created by daniel.irwin on 5/24/17.
 */

module.exports = {

    //reduce lazy loading
    parseUrl : (function(){
        return require('url').parse;
    }()),

    parseQuery : (function(){
        return require('querystring').parse;
    }()),

    decompileRoute : (route) => {
        let parse = module.exports.parseUrl(route);
        let routeUrl = parse.pathname;
        let method = 'GET';
        let methodRegex = /GET|POST|PUT|PATCH|DELETE|HEAD/i;

        if(route.indexOf(methodRegex) === 0){
            method = route.match(method)[0].toUpperCase();
            route = route.replace(methodRegex, '').trim();
        }

        return {
            method : method,
            route : route,
            path : decodeURIComponent(routeUrl),//because url.parse encodes it :(
            regex : new RegExp(routeUrl.split(/{{\w+}}/g).join('(\\w+)').replace(/\//g,'\\/')),
            pathParams : (routeUrl.match(/{{\w+}}/g) || []).map(s => s.replace(/{{|}}/g, '')) || [],
            query : module.exports.parseQuery(parse.query) || {}
        };
    },

    conductor : function(routeMap){

        //for easy traversal, sorted by length so the largest route is chosen when a tie (it doesnt even get into a tie)
        let routes = Object.keys(routeMap).map( (route) => this.decompileRoute(route)).sort( (a, b) => a.regex.length - b.regex.length);


        //conductor acts upon a requested route
        return (requestedRoute) => {

            let routeFind = routes.find((route) => route.regex.test(requestedRoute));

            if(routeFind){
                let parsed = this.parseUrl(requestedRoute);
                let query = this.parseQuery(parsed.query);
                let matches = routeFind.regex.exec(requestedRoute);

                let routeQueryKeys = Object.keys(routeFind.query);

                let missingParams = [];
                let resolvedQueryParams = routeQueryKeys.reduce((acc, v) => {
                    if(query[v]) {
                        acc[routeFind.query[v] ? routeFind.query[v].replace(/{{|}}|{|}/g, '') : ''] = query[v];
                    }
                    else if(/{{.*}}/g.test(routeFind.query[v])){
                        missingParams.push(v);
                    }
                    return acc;
                }, {});

                if(missingParams.length > 0){
                    throw new Error('missing parameter(s) ' + missingParams);
                }

                let pathParams = routeFind.pathParams.reduce((acc, key, i) => {
                    acc[key] = matches[i+1];
                    return acc;
                }, {});

                return {
                    rail : routeMap[routeFind.route],
                    requestedRoute: requestedRoute,
                    queryParams : resolvedQueryParams,
                    pathParams : pathParams,

                    //What AWS Calls Them
                    queryStringParameters : resolvedQueryParams,
                    pathParameters : pathParams,
                    resource : requestedRoute
                };
            }
        };
    }

};