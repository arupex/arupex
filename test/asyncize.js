/**
 * Created by daniel.irwin on 6/23/17.
 */
describe('asyncize', function(){

    let asyncize = require('../lib/asyncize');

    it('test ok', (done) => {

        let func = asyncize.async('ok');

        func().then((data) => {
            if(data === 'ok') {
                done();
            }
            else {
                done(new Error(`data was ${data}`));
            }
        }, (error) => {
            done(new Error(`data was ${error}`));
        });

    });

    it('test fail', (done) => {

        let func = asyncize.async(undefined, 'fail');

        func().then((data) => {
            done(new Error(`data was ${data}`));
        }, (error) => {
            if(error === 'fail') {
                done();
            }
            else {
                done(new Error(`error was ${error}`));
            }
        })

    });

    it('test spreader', (done) => {

        let func1Called = false;
        let func2Called = false;

        let spreadFunc = asyncize.spreader(function() {
            func1Called = true;
        }, function(){

            if(!func1Called){
                done(new Error('First Callback was not called'));
            }
            else {
                done();
            }
        });

        spreadFunc();

    });

});