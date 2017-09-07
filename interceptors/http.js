/**
 * Created by daniel.irwin on 6/17/17.
 */
module.exports = (function() {

    let server = null;

    return {
        start : function (port, opts) {
            const http = require('http');

            let dir = opts.dir || process.cwd();

            let routes = require(`${dir}/routes`);

            let lambdas = require('./lambdas')(opts);

            let conductor = require('../lib/routeAnalyzer').conductor(routes);

            let cookieParser = require('../lib/cookieParser');

            server = http.createServer((httpRequest, httpResponse) => {
                 function (req, res) {
                   let choosenRoute = conductor(req.url);
                    if (!choosenRoute) {
                        res.write('HTTP/1.1 404 Not Found\r\n\r\n');
                        res.end();
                    }
                    else {
                        lambdas[choosenRoute.rail](Object.assign({
                            cookies: cookieParser(req.headers)
                        }, choosenRoute, {
                            body: req.body,
                            headers: req.headers
                        }), {}, (err, data, ress) => {
                            if (typeof data !== 'string') {
                                data = JSON.stringify(data);
                            }
                            res.end(data);
                        });
                    }   
                }(httpRequest, httpResponse);
            });

            server.on('clientError', (err, socket) => {
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            });

            server.listen(port || 1337);
        }
    ,
        close : (cb) => {
            if(server){
                server.close(() => {
                    server = null;
                    if(typeof cb === 'function'){
                        cb();
                    }
                });
            }
        }
    }
    ;

})();
