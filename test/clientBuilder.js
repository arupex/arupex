/**
 * Created by daniel.irwin on 5/24/17.
 */

describe('Client-Builder', () => {

    let clientBuilder = require('../lib/clientBuilder');

    it('basic', (done) => {

        let calls = [
            'GET latest?base={{base}}',
            'latest?symbols={{symbols}}'
        ];

        let client = new clientBuilder(calls).init({
            baseUrl : 'http://api.fixer.io/',
            respondWithProperty : 'rates'
        });

        console.log('client', client);


        client.getLatestBySymbols({symbols : 'JPY'}).then((data) => {
            console.log('currency result', data.JPY);
            done();
        });

    });

    it('params', () => {

    });

    it('body', () => {

    });

});