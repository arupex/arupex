/**
 * Created by daniel.irwin on 5/22/17.
 */

let loadDirectories = require(__dirname + '/lib/requireDirectory').requireDirSync;

module.exports = {
    interceptors : loadDirectories(__dirname + '/interceptors'),
    lib : loadDirectories(__dirname + '/lib')
};