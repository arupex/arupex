/**
 * Created by daniel.irwin on 6/6/17.
 */

'use strict';
module.exports = {

    requireDirSync: function LoadDirModules(dir, watch, watcher, filter) {
        var fs = require('fs');

        function cleanFileName(name) {
            return name.replace('.js', '');
        }

        function acceptableFile(name) {
            return name.match(/\.js$/);
        }

        var modules = {};

        if (watch) {
            fs.watch(dir, function (event, filename) {
                var file = cleanFileName(filename);
                if (acceptableFile(file)) {
                    require.cache = {};//just nuke it all! probably should be smarter about this
                    modules[file] = require(dir + '/' + file);
                    if(typeof watcher === 'function'){
                        watcher(file, modules[file]);
                    }
                }

            });
        }

        fs.readdirSync(dir).filter(filter || (()=>true)).forEach(function (name) {
            if(acceptableFile(name)) {
                modules[cleanFileName(name)] = require(dir + '/' + name);
            }
        });

        return modules;
    }

};