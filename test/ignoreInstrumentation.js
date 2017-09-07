
describe('ignoreInstrumentation', function(){

    let assert = require('assert');

    let tracer = require('../lib/trace');

    function generateDumbyService(ignoreInstrumentation){
        return {
            getThing : function(){
                let p = new Promise((resolve) => {
                    resolve({
                        key : 'value',
                        ignoreInstrumentation : ignoreInstrumentation
                    });
                });
                return p;
            }
        };
    }

    function myTracer(array){
        return tracer((type, getSet) => {
            array.push(type);
            array.push(getSet);
        }, true, (action, name) => {

        });
    }



    it('disabled', (done) => {

        let array = [];

        let DataService = generateDumbyService(false);
        let tracedDataService = myTracer(array)(DataService);

        tracedDataService.getThing().then((data) => {
            assert.deepEqual(data.key, 'value');

            assert.deepEqual(array, ['function', 'getThing', 'property', 'key.get']);

            done();
        });

    });


    it('enabled', (done) => {

        let array = [];

        let DataService = generateDumbyService(true);
        let tracedDataService = myTracer(array)(DataService);

        tracedDataService.getThing().then((data) => {
            assert.deepEqual(data.key, 'value');

            assert.deepEqual(array, ['function', 'getThing']);

            done();
        });

    });


});