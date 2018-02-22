/**
 * Created by daniel.irwin on 7/7/17.
 */
module.exports = function multiDirLoader(dir, filter){

    const fs = require('fs');

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

    if(Array.isArray(dir)) {
        return dir.reduce((acc, aDir) => {
            let name = aDir.substr(aDir.lastIndexOf('/', aDir.length-2)+1);
            name = name.substr(0,name.lastIndexOf('/'));

            acc[name] = LoadDirModules(aDir, false);
            return acc;
        }, {});
    }
    else {
        return LoadDirModules(dir, true);
    }

    function LoadDirModules(dir, recursive) {

        var modules = {};

        let directory = [];

        try {
            directory = fs.readdirSync(dir);
        }
        catch(e){}

            directory.filter(n => n.indexOf('.git') === -1)
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
                            modules[name] = LoadDirModules(filename, false);
                        }
                    }
                }
            });

        return modules;
    }


};