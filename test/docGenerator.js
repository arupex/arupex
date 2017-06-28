/**
 * Created by daniel.irwin on 5/24/17.
 */
describe('docGenerator', function () {

    let docGenerator = require('../lib/docGenerator');

    it('generate simple swagger doc', () => {

        let doc = docGenerator.generateFromUrls([
            '/api/v1/measures/{{measure_id}}/meta?node_id={{node_id}}'
        ], {headers: ['Authorization']});



        console.log('', JSON.stringify(doc, null, 3));
    });

});