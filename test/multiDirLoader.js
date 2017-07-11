/**
 * Created by daniel.irwin on 7/8/17.
 */
describe('multiDirLoader', function(){

    let loader = require('../lib/multiDirLoader');

    it('load dirs', () => {

        console.log('', loader(`${__dirname}/../lib/`));

        console.log('\n\n\n');

        // console.log('', loader(`${__dirname}/../demo/`));

    });

});