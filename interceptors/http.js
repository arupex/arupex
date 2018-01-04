/**
 * Created by daniel.irwin on 6/17/17.
 */
module.exports = (function () {

    let server = null;

    return {
        start: function (port, opts) {
            const http = require('http');

            let dir = opts.dir || process.cwd();
            let routes = opts.routes || require(`${dir}/routes`);
            let conductor = require('../lib/routeAnalyzer').conductor(routes);

            let cookieParser = require('../lib/cookieParser');

            const LambdaFactory = require('./lambdas');

            server = http.createServer((req, res) => {

                let lambdas = LambdaFactory(opts);

                const choosenRoute = conductor(req.url);

                if (!choosenRoute) {
                    res.write();
                    res.end('HTTP/1.1 404 Not Found\r\n\r\n');
                    return;
                }

                const event = Object.assign({
                    cookies: cookieParser(req.headers)
                }, choosenRoute, {
                    body: req.body,
                    headers: req.headers
                });

                const context = {};

                lambdas[choosenRoute.rail](event, context, (err, data) => {
                    if (typeof data !== 'string') {
                        data = JSON.stringify(data);
                    }
                    res.end(data);
                });

            });

            server.on('clientError', (err, socket) => {
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            });

            server.keepAliveTimeout = 0;

            server.listen(port || 1337);
        },

        close: (cb) => {
            if (server) {
                server.close(() => {
                    server = null;
                    if (typeof cb === 'function') {
                        cb();
                    }
                });
            }
        }
    };

})();
