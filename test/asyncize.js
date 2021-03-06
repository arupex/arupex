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


    it('test ability to pass in opts object callbacks', (done) => {
        asyncize.conform('data')({}, function() {
            done();
        }, function(){

        });
    });


    it('test ability to pass in opts object promise', (done) => {
        asyncize.conform('data')({}).then(function() {
            done();
        }, function(){

        });
    });


    it('test ability to pass in opts object callback fail', (done) => {
        asyncize.conform(null, 'error')({}, function() {
            done(new Error('called success when should have failed'));
        }, function(){
            done();
        });
    });


    it('test ability to pass in opts object promise fail', (done) => {
        asyncize.conform(null, 'error')({}).then(function() {

        }, function(){
            done();
        });
    });



//QUERY


    it('test ability to pass in opts object callback query', (done) => {
        asyncize.conform(null, 'error', {'qu': 'data'})('qu', function(data) {
            if(data === 'data'){
                done();
            }
        }, function(){

        });
    });


    it('test ability to pass in opts object promise query', (done) => {
        asyncize.conform(null, 'error', {'qu':'data'})('qu').then(function(data) {
            if(data === 'data'){
                done();
            }
        }, function(){

        });
    });






    it('test ability to pass in opts object callback query fail', (done) => {
        asyncize.conform(null, 'error', {})({}, function() {

        }, function(){
            done();
        });
    });


    it('test ability to pass in opts object promise query fail', (done) => {
        let func = asyncize.conform(null, 'error', { '{"code" : "JPY", "date" : "2017" }' : 6 });

        func({
            code : 'JPY',
            date : '2017'
        }).then(function(data) {
            if(data !== 6){
                done(new Error('value was not 6'));
            }
            else {
                done();
            }
        }, function(err){
            done(new Error(err));
        });
    });


    it('test ability to pass in opts object promise query fail becaues of query', (done) => {
        let func = asyncize.conform(null, 'error', { '{"code" : "DOG", "date" : "2017" }' : 6 });

        func({
            code : 'JPY',
            date : '2017'
        }).then(function(data) {
            done(new Error(data));
        }, function(err){
            if(err === 'error') {
                done();
            }
            else {
                done(new Error(err));
            }
        });
    });

    it('test ability to pass in opts object promise query good', (done) => {
        let func = asyncize.conform(null, null, { '{"code" : "JPY", "date" : "2017" }' : 6 });

        func({
            code : 'JPY',
            date : '2017'
        }).then(function(data) {
            if(data !== 6){
                done(new Error('value was not 6'));
            }
            else {
                done();
            }

        }, function(){
            done(new Error('error was triggered instead of success'));
        });
    });

});