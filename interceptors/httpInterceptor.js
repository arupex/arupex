/**
 * Created by daniel.irwin on 6/17/17.
 */
module.exports = {
  start : function(port){
      const http = require('http');

      const server = http.createServer((req, res) => {
          res.end();
      });

      server.on('clientError', (err, socket) => {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      });

      server.listen(port || 1337);
  }
};