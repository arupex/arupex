describe('multiple-http-requests-http-interceptor', function() {

    let httpServer = require('../arupex').interceptors.http;

    httpServer.start(7331, {
       dir : `${__dirname}/../demo/`,
        routes : {
            '/api/v1/userCurrency?base={{base}}': 'userCurrency'
        },
        disableTracer : true
    });

    let hyper = require('hyper-request');

    let client = new hyper({
        baseUrl : 'http://localhost:7331/api/v1/',
        respondWithProperty : false,
        cacheTtl: 0,
        disablePipe: true
    });

    let client2 = new hyper({
        baseUrl : 'http://localhost:7331/api/v1/',
        respondWithProperty : false,
        cacheTtl: 0,
        disablePipe: true
    });

    let assert = require('assert').deepEqual;

    it('test', function(done) {

        this.timeout(200000);

        Promise.all([
            client.get('userCurrency?base=USD').then( (data) => {
                console.log('\n\nrecieved1', data, '\n\n');
                return data;
            }),
            client2.get('userCurrency?base=JPY').then( (data) => {
                console.log('\n\nrecieved2', data, '\n\n');
            })
        ]).then( (results) => {

            console.log('', results);

            done();
        }, (err) => {
            done(err);
        });

    });

});