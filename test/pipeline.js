/**
 * Created by daniel.irwin on 6/25/17.
 */
describe('pipeline', function(){

    let pipeline = require('../lib/pipeline');

    it('test1', function(done){


        pipeline({
            timeout : 1000
        }, [
            function cycle(context, response) {
                console.log('func');
                context.func = 'happened';
                response.ok('finished');
            }
        ])({
            initData : 'started'
        }, {
            ok : function ok(data){
                console.log('ok', data);
                done()
            }
        }, function final(context){
            console.log('context', context);
        });
    });

    it('test2', function(done){

        pipeline({
            timeout : 1000
        }, [
            function cycle(context) {
                console.log('func');
                context.func = 'happened';
            }
        ])({
            initData : 'started'
        }, {
            ok : function ok(data){
                console.log('ok', data);
            }
        }, function final(context){
            console.log('context', context);
            done()
        });


    });

});