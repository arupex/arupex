/**
 * Created by daniel.irwin on 5/24/17.
 */

describe('Route-Analyzer', () => {


    let router = require('../lib/routeAnalyzer');
    let assert = require('assert');

    it('decompile route validation test', () => {

        let route = '/api/v1/measures/{{measureId}}/metadata?locale={{locale}}&session={{session}}';
        let testUrl = 'http://localhost:1337/api/v1/measures/123/metadata?locale=en_US&session=fred';

        let routes = {};
        routes[route] = {
            action : '',
            pre : [],
            post : []
        };

        assert.equal(JSON.stringify(router.conductor(routes)(testUrl), null , 3), JSON.stringify({
            rail: {
                action: '',
                pre : [],
                post : []
            },
            requestedRoute: 'http://localhost:1337/api/v1/measures/123/metadata?locale=en_US&session=fred',
            queryParams: {
                locale: 'en_US',
                session: 'fred'
            },
            pathParams: {
                measureId: '123'
            }
        }, null, 3));

    });


    it('decompile route', () => {

        let route = '/api/v1/measures/{{measureId}}/metadata?locale={{locale}}&session={{session}}';

        console.log(JSON.stringify(router.decompileRoute(route), null, 3));

    });



    it('required parameters route', (done) => {

        let routes = {
            '/api/v1/measures/{{measureId}}/metadata?locale={{locale}}&ticket={{session}}&friend={{friend}}&notrequired={notrequired}' : {
                action : '',
                pre : [],
                post : []
            }
        };
        //first one should be a success
        router.conductor(routes)('http://localhost:1337/api/v1/measures/123/metadata?locale=en_US&ticket=gary&friend=fred');

        try {
            //should say ticket and friend are required
            router.conductor(routes)('http://localhost:1337/api/v1/measures/123/metadata?locale=en_US');
        }
        catch(e){
            assert.ok(e.message.indexOf('ticket,friend') > -1);
            done();
        }

    });
});