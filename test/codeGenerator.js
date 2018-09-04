/**
 * Created by daniel.irwin on 5/23/17.
 */

describe ('Code-Gen', () => {

    let clientBuilder = require('../lib/clientBuilder');

    let codeGen = require('../lib/codeGenerator');

    it('basic', (done) => {

        let memoryClient = new clientBuilder([
            // 'GET latest?base={{base}}',
            // 'latest?symbols={{symbols}}'

            'get measures?node_id={{node_id}}',
            'get measures/{{measuresId}}',
            'put measures/{{measureId}}',
            'post measures',
            'delete measures/{{measureId}}?hard_delete={{hard_delete}}',
            'patch measures/{{measureId}}',
            'get measures/{{measureId}}/activity',
            'get measures/{{measureId}}/comments',
            'post measures/{{measureId}}/comments',
            'get measures/{{measureId}}/attachments',
            'get attachments{{id}}',
            'post measures/{{measureId}}/attachments',
            'put attachments/{{id}}',
            'patch attachments/{{id}}',
            'delete attachments/{{id}}',

            'latest?base={{base}}'
        ]);

        console.log('client', memoryClient);

        codeGen(memoryClient, __dirname + '/../tmp/fixerClient.js');

        let client = require(__dirname + '/../tmp/fixerClient.js').init({
            baseUrl : 'http://api.fixer.io/',
            respondWithProperty : false
        }, true);


        client.getLatestByBase({ base : 'JPY'}).then((data)=>{
           console.log( 'data', data);
           done()
        }, () => {
         done();//fixer.io is not public anymore we will get an error, FIXME!
        });

    });

});
