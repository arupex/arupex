
const cookieParser = require('../lib/cookieParser');
const routeAnalyzer = require('../lib/routeAnalyzer');

const http = require('http');

class AdvancedHttpServer {

    constructor() {
        this.server = null;
    }

    start(port, lambdas, routes, authorizer, ignoreAuthorizerRoutes) {

        let conductor = routeAnalyzer.conductor(routes);

        this.server = http.createServer((req, res) => {

            const chosenRoute = conductor(req.url);

            if (!chosenRoute) {
                res.write(`${req.url} was not found a route for`);
                res.end('HTTP/1.1 404 Not Found\r\n\r\n');
                return;
            }

            let body = [];
            req.on('data', (chunk) => {
                body.push(chunk);

            }).on('end', () => {

                body = Buffer.concat(body).toString();

                const event = Object.assign({
                    cookies: cookieParser(req.headers)
                }, chosenRoute, {
                    body: body,
                    headers: req.headers
                });

                const context = {};

                let sessionAuthorizer = authorizer;

                //ping shouldnt have to go through the authorizer
                if (typeof authorizer !== 'function' || (ignoreAuthorizerRoutes || []).includes(chosenRoute.resource)) {
                    sessionAuthorizer = function (event, context, callback) {
                        callback(null, {});
                    };
                }

                sessionAuthorizer({
                    type: 'TOKEN',
                    methodArn: 'arn:aws:execute-api:us-west-2:123456789:sbcdefgh/null/GET/',
                    authorizationToken: req.headers.authorization || req.headers.Authorization,
                    resource: 'auth'
                }, {}, (authorizerErr, authorizerData) => {

                    if (authorizerErr || authorizerData.statusCode === 401 || (typeof authorizerData.body === 'object' && authorizerData.body.code === 401)) {
                        res.statusCode = 401;
                        return res.end(JSON.stringify({
                            code: 401,
                            message: 'authorization failed'
                        }));
                    }

                    if (typeof lambdas[chosenRoute.rail] !== 'function') {
                        res.statusCode = 500;
                        return res.end(JSON.stringify({
                            code : 500,
                            error : `lambdas does not have a rail of ${chosenRoute.rail} it does have ${Object.keys(lambdas)}`
                        }));
                    }

                    lambdas[chosenRoute.rail](Object.assign({}, event, {
                        httpMethod: req.method || 'GET',
                        requestContext: {authorizer: authorizerData}
                    }), context, (err, data) => {
                        // destringify body
                        if (err) {
                            console.log('oh snap', err);
                        }

                        if(data && typeof data === 'object' && typeof data.body === 'string') {
                            data = JSON.parse(data.body);
                        }

                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.setHeader('Content-Type', 'application/json');

                        res.statusCode = data.code || 200;
                        if (typeof data !== 'string') {
                            data = JSON.stringify(data);
                        }
                        res.end(data);
                    });

                });
            });
        });

        this.server.on('clientError', (err, socket) => {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });

        this.server.keepAliveTimeout = 0;

        this.server.listen(port || 1337);
    }

    close(cb) {
        if (this.server) {
            this.server.close(() => {
                this.server = null;
                if (typeof cb === 'function') {
                    cb();
                }
            });
        }
    }
}

module.exports = AdvancedHttpServer;