/**
 * Created by daniel.irwin on 6/6/17.
 */

describe('structured', () => {

    let structured = require('../lib/structured');

    let assert = require('assert');

    it('to structure', () => {

        let struct = structured.toStructure({
            MeasureService : {
                getOne : function(){},
                getAll : function(){},
                create : function(){},
                update : function(){},
                delete : function(){}
            },
            UserService : {
                getLocale : function(){},
                getName : function(){}
            },
            ActivityService : {
                getOne : function(){}
            },
            globalFunc : function(){}
        });

        assert.equal(JSON.stringify(struct), JSON.stringify({
            MeasureService : {
                getOne : 'MeasureService.getOne',
                getAll : 'MeasureService.getAll',
                create : 'MeasureService.create',
                update : 'MeasureService.update',
                delete : 'MeasureService.delete'
            },
            UserService : {
                getLocale : 'UserService.getLocale',
                getName : 'UserService.getName'
            },
            ActivityService : {
                getOne : 'ActivityService.getOne'
            },
            globalFunc : 'globalFunc'
        }));

    });

    it('to generator', (done) => {
        let struct = structured.toGenerator({
            MeasureService : {
                getOne : function(){},
                getAll : function(){},
                create : function(){},
                update : function(){},
                delete : function(){}
            },
            UserService : {
                getLocale : function(){},
                getName : function(){}
            },
            ActivityService : {
                getOne : function(){}
            },
            globalFunc : function(){}
        });

        let structuredGenerator = __dirname + '/../tmp/structGenerator.js';

        let codeGenerator = require('../lib/codeGenerator');
        codeGenerator(struct, structuredGenerator);

        let code = require(structuredGenerator);

        code.MeasureService.getAll.setSuccess({ message : 'ok' });

        assert.equal(!!code.MeasureService.getAll.data, true);
        assert.equal(!!code.MeasureService.getAll.error, false);


        let imp = structured.toImplentation(code);

        imp.MeasureService.getAll({}).then((data) => {
            assert.equal(JSON.stringify(data), JSON.stringify({ message: 'ok'}));
            done();
        }, (err) => {
            done(new Error(err).stack);
        });
    });

    it('to implementation', (done) => {
        let imp = structured.toImplentation({
            MeasureService : {
                getOne : { data : { id : 1 } }
            },
            UserService : {
                getLocale : { error : 'error occured' },
            },
            globalFunc : { data : 'globalFunc' }
        });

        imp.MeasureService.getOne().then((measure)=>{
            assert.equal(JSON.stringify(measure), JSON.stringify({ id : 1 }));
            imp.UserService.getLocale().then(() => {

            }, (e) => {
                assert.equal(e, 'error occured');
                done();
            });

        }, (e) => {
            console.log('e', e);
        });

    });


});