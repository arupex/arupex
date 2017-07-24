/**
 * Created by daniel.irwin on 7/7/17.
 */
module.exports = function multiDirLoader(dir, filter){

    var fs = require('fs');

    /**
     * Created by daniel.irwin on 6/6/17.
     */
    let filterfunction = filter || (e => true);

    function cleanFileName(name) {
        return name.replace('.js', '');
    }

    function acceptableFile(name) {
        return name.match(/\.js$/);
    }

    function LoadDirModules(dir, recursive) {

        var modules = {};

        fs.readdirSync(dir)
            .filter(n => n.indexOf('.git') === -1)
            .filter(n => n.length > 2)
            .filter(filterfunction)
            .forEach(function (name) {
                let filename = `${dir}/${name}`;

                // console.log('module', filename);
                if(acceptableFile(name)) {
                    try {
                        modules[cleanFileName(name)] = require(filename);
                    }catch(e){}
                }
                else if(recursive) {//hope its a dir?
                    try {
                        fs.readFileSync(filename);//throws a specific error if a directory
                    }
                    catch(e){
                        if(e.message === 'EISDIR: illegal operation on a directory, read'){
                            modules[name] = module.exports(filename, false);
                        }
                    }
                }
            });

        return modules;
    }

    return LoadDirModules(dir, true);
};