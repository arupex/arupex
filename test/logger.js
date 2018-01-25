/**
 * Created by daniel.irwin on 6/19/17.
 */

describe('logger', function(){

    let logger = require('../lib/logger');

    it('quick prod test', () => {
        process.env.NODE_ENV = 'prod';

        let myLogger = new logger('Prod Logger', {});

        myLogger.info('quick test');
        myLogger.info('quick test', [{ test : 'test1'}, { test : 'test2'}]);

        let crazyArray = [];
        for(let i = 0; i < 512; ++i){
            crazyArray.push({ x : i});
        }
        myLogger.info(crazyArray);
    });

    it('quick dev test', () => {
        process.env.NODE_ENV = 'dev';

        let myLogger = new logger('Dev Logger', {});

        myLogger.info('quick test');
        myLogger.info('quick test', [{ test : 'test1'}, { test : 'test2'}]);

    });


    it('quick box dev test', () => {
        process.env.NODE_ENV = 'dev';

        let myLogger = new logger('Dev Logger', {});

        myLogger.box('quick test', [{ test : 'test1'}, { test : 'test2'}]);
        myLogger.pretty('quick test', [{ test : 'test1'}, { test : 'test2'}]);

    });


});