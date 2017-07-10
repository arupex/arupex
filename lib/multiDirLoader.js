/**
 * Created by daniel.irwin on 7/7/17.
 */
module.exports = function(dir, filter){
    let childProcess = require('child_process');
    //utf8 is short sighted
    return childProcess.spawnSync('tree', ['-f'], {
        cwd : dir
    }).stdout.toString('utf8')
        .split('\n')
        .map((s)=>s.replace(/^.* \./, '.'))
        .filter( a => a.indexOf('.js') > -1)
        .filter(filter || (e => true))
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