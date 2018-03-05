/**
 * Created by daniel.irwin on 5/24/17.
 */

const parseQuery = require('querystring').parse;
const parseUrl = require('url').parse;
const logger = require('./logger');
const LOG = new logger('Arupex-RouteAnalyzer');
class RouteAnalyzer {

    decompileRoute(route) {
        let parse = parseUrl(route);
        let routeUrl = parse.pathname;
        let method = 'GET';
        let methodRegex = /GET|POST|PUT|PATCH|DELETE|HEAD/i;

        if(route.indexOf(methodRegex) === 0){
            method = route.match(method)[0].toUpperCase();
            route = route.replace(methodRegex, '').trim();
        }

        const routeVariable = /{{\w+}}/g;

        return {
            method : method,
            route : route,
            path : decodeURIComponent(routeUrl),//because url.parse encodes it :(
            regex : new RegExp(routeUrl.split(routeVariable).join('([\\w+|-]+)').replace(/\//g,'\\/')),
            pathParams : (routeUrl.match(routeVariable) || []).map(s => s.replace(/{{|}}/g, '')) || [],
            routePieces : (routeUrl.includes('?')?routeUrl.substr(0, routeUrl.indexOf('?')):routeUrl).split(/{{\w+}}|\//g).filter(e=>e),
            query : parseQuery(parse.query) || {}
        };
    }

    conductor(routeMap) {

        let routes = Object.keys(routeMap)
            .map( (route) => this.decompileRoute(route));


        //conductor acts upon a requested route
        return (requestedRoute) => {

            let routesFound = routes.filter( route => route.regex.test(requestedRoute));
            let routeFind = this.findLongestRoute(routesFound);

            if(routeFind){
                let parsed = parseUrl(requestedRoute);
                let query = parseQuery(parsed.query);
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

                return Object.assign({}, routeFind, {
                    rail : routeMap[routeFind.route],
                    requestedRoute: requestedRoute,
                    queryParams : resolvedQueryParams,
                    pathParams : pathParams,

                    //What AWS Calls Them
                    queryStringParameters : resolvedQueryParams,
                    pathParameters : pathParams,
                    resource : requestedRoute
                });
            }
        };
    }

    findLongestRoute(routesFound) {
        let routeFind = null;
        if (routesFound.length > 1) {
            LOG.warn(`multiple routes matched looking for the one with the largest length`);
            let routeLengths = routesFound.reduce((acc, v) => {
                if (v.length > acc.length) {
                    acc = {
                        length: v.length,
                        last: v,
                        count: 1
                    };
                }
                if (v.length = acc.length) {
                    acc.count++;
                    acc.last = v;
                }
                return acc;
            }, {
                length: routesFound[0].length,
                last: routesFound[0],
                count: 1
            });

            if (routeLengths.count > 1) {
                LOG.warn(`multiple routes were considered the 'longest', selecting the last one`);
            }
            routeFind = routeLengths.last;
        }
        else if (routesFound.length === 1) {
            routeFind = routesFound[0];
        }
        return routeFind;
    }
}

module.exports = new RouteAnalyzer();