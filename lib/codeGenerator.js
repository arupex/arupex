/**
 * Created by daniel.irwin on 5/23/17.
 */
module.exports = function CodeGen(code, file){

    let fs = require('fs');


    let obj2 = function (obj) {
        let str = '';

        for (var p in obj) {
            if(p !== '_fncVarReplacements') {
                if (obj.hasOwnProperty(p)) {
                    if (typeof obj[p] === 'function') {
                        let funcStr = obj[p] + '';
                        /* jshint ignore:start */
                        if (obj._fncVarReplacements && obj._fncVarReplacements[p]) {
                            funcStr = Object.keys(obj._fncVarReplacements[p]).reduce((acc, v) => {
                                return acc.replace(v, '"' + obj._fncVarReplacements[p][v] + '"');
                            }, funcStr);

                        }
                        /* jshint ignore:end */

                        str +=  p + ':' + funcStr + ',\n';
                    }
                    else if(typeof obj[p] === 'object') {
                        //sometimes recursion is just the easiest way :(
                        str += p + ': { ' + obj2(obj[p]) + '},';
                    }
                    else {
                        str += p + ':' + JSON.stringify(obj[p], null, 3) + ',\n';
                    }
                }
            }
        }
        return str;
    };

    function objToString (obj) {
        var str = obj2(obj);
        return 'module.exports = {\n' + str.replace(/        /g, '   ') + '\n};';
    }

    let data = objToString(code);

    fs.writeFileSync(file, data, 'utf8');

};