/**
 * Created by daniel.irwin on 6/6/17.
 */

'use strict';
module.exports = {

    requireDirSync: function LoadDirModules(dir, watch) {
        var fs = require('fs');

        var modules = {};

        if (watch) {
            fs.watch(dir, function (event, filename) {
                var file = filename.split('.')[0];
                if (modules[file]) {
                    require.cache = {};//just nuke it all! probably should be smarter about this
                    modules[file] = require(dir + '/' + file);
                }

            });
        }

        fs.readdirSync(dir).forEach(function (name) {
            modules[name.split('.')[0]] = require(dir + '/' + name);
        });

        return modules;
    }

};