/**
 * Created by daniel.irwin on 6/6/17.
 */

describe('injector', () => {

    let injector = require('../lib/injector');

    let assert = require('assert');

    it('happy path', () => {
        let a = 0;
        let b = 0;
        injector({
            testService : { t : () => { a = 1; }},
            service2 : { a : () => { b = 1;}}
            },
            function(service2, testService){
                service2.a();
                testService.t();
        });

        assert.equal(a, 1);
        assert.equal(b, 1);

    });

    it('with undefineds', () => {
        let a = 0;
        let b = 0;
        injector({
                testService : { t : () => { a = 1; }},
                service2 : { a : () => { b = 1;}}
            },
            function(anotherService, service2, testService){
                service2.a();
                testService.t();
            });

        assert.equal(a, 1);
        assert.equal(b, 1);
    });

    it('arrow function', () => {
        let a = 0;
        let b = 0;
        injector({
                testService : { t : () => { a = 1; }},
                service2 : { a : () => { b = 1;}}
            },
            (anotherService, service2, testService) => {
                service2.a();
                testService.t();
            });

        assert.equal(a, 1);
        assert.equal(b, 1);
    });


    it('arrow function with comments', () => {
        let a = 0;
        let b = 0;
        injector({
                testService : { t : () => { a = 1; }},
                service2 : { a : () => { b = 1;}}
            },
            (/*comment1*/anotherService, /*comment2*/service2, /*comment3*/testService/*comment4*/) => { //test
                service2.a();
                testService.t();
            });

        assert.equal(a, 1);
        assert.equal(b, 1);
    });



    it('function with comments', () => {
        let a = 0;
        let b = 0;
        injector({
                testService : { t : () => { a = 1; }},
                service2 : { a : () => { b = 1;}}
            },
            function(/*comment1*/anotherService, /*comment2*/service2, /*comment3*/testService/*comment4*/) { //test
                service2.a();
                testService.t();
            });

        assert.equal(a, 1);
        assert.equal(b, 1);
    });

});