/**
 * Created by daniel.irwin on 6/17/17.
 */
module.exports = {
  start : function(port, opts){
      const http = require('http');

      let dir             = opts.dir || process.cwd();

      let routes          = require(`${dir}/routes`);

      let lambdas = require('./lambdas')(opts);

      let conductor = require('../lib/routeAnalyzer').conductor(routes);

      let cookieParser = require('../lib/cookieParser');

      const server = http.createServer((req, res) => {
          let choosenRoute = conductor(req.url);
          if(!choosenRoute) {
              res.write('HTTP/1.1 404 Not Found\r\n\r\n');
              res.end();
          }
          else {
              lambdas[choosenRoute.rail](Object.assign({
                cookies : cookieParser(req.headers)
              }, choosenRoute), {

              }, (err, data, ress) => {
                  if(typeof data !== 'string'){
                      data = JSON.stringify(data);
                  }
                  res.end(data);
              });
          }
      });

      server.on('clientError', (err, socket) => {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      });

      server.listen(port || 1337);
  }
};
