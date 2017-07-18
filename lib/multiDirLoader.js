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


    let childProcess = require('child_process');
    //utf8 is short sighted
    let tree = childProcess.spawnSync('tree', ['-f'], {
        cwd : dir
    }).stdout;

    if(tree === null){
        return LoadDirModules(dir, true);
    }

    return tree.toString('utf8')
        .split('\n')
        .map((s)=>s.replace(/^.* \./, '.'))
        .filter( a => a.indexOf('.js') > -1)
        .filter(filterfunction)
        .reduce( (acc, v) => {
            let nesting = v.split('/');
            let name = nesting.pop().replace('.js','');
            nesting.shift();

            let pointer = acc;

            while(nesting.length > 0){
                let nextkey = nesting.shift();

                if(typeof pointer[nextkey] === 'undefined') {
                    pointer[nextkey] = {};
                }

                pointer = pointer[nextkey];
            }

            pointer[name] = require(dir + v);
            return acc;
        }, {});
};