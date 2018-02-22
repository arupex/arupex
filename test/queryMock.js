
describe('query structured', () => {

    let structured = require('../lib/structured');

    let assert = require('assert');

    it('to query structure', () => {
        const query = { id : 1 };
        const queryString = JSON.stringify(query);

        let imp = structured.toImplentation({
            GoodService : {
                getOne : {
                    query : {
                        [queryString] : { message : 'yeah!' }
                    }
                }
            },
            BadService : {
                getOne : {
                    data : {
                        [queryString] : { message : 'uh oh' }
                    }
                }
            }

        });

        Promise.all([
            imp.GoodService.getOne(query),
            imp.BadService.getOne(query)
        ]).then(([good, bad]) => {

            assert.deepEqual(good, { message : 'yeah!' });
            assert.deepEqual(bad, { '{"id":1}': { message: 'uh oh' } });

        });
    });



});