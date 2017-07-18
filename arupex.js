/**
 * Created by daniel.irwin on 5/22/17.
 */

let loadDirectories = require(__dirname + '/lib/requireDirectory').requireDirSync;

function ignoreBin(filename){
    return filename.indexOf('bin') === -1 &&
    filename.indexOf('demo') === -1  &&
    filename.indexOf('tmp') === -1 &&
    filename.indexOf('test') === -1;
}

module.exports = {
    interceptors : loadDirectories(__dirname + '/interceptors', ignoreBin),
    lib : loadDirectories(__dirname + '/lib', ignoreBin)
};