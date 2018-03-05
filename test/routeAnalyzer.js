/**
 * Created by daniel.irwin on 5/24/17.
 */

describe('Route-Analyzer', () => {


    let router = require('../lib/routeAnalyzer');
    let assert = require('assert');


    function ignoreFields(fields){
        return function(obj){
          fields.forEach( e => delete obj[e]);
          return obj;
        };
    }

    const ignore = ignoreFields([
        'queryStringParameters',
        'pathParameters',
        'resource',
        'method',
        'route',
        'regex',
        'path',
        'pathPieces',
        'routePieces',
        'query'
    ]);

    it('decompile route validation test', () => {

        let route = '/api/v1/measures/{{measureId}}/metadata?locale={{locale}}&session={{session}}';
        let testUrl = 'http://localhost:1337/api/v1/measures/123/metadata?locale=en_US&session=fred';

        let routes = {};
        routes[route] = 'thing';

        const actual = JSON.stringify(ignore(router.conductor(routes)(testUrl)), null , 3);

        const expected = JSON.stringify({
            pathParams: {
                measureId: '123'
            },
            rail: 'thing',
            requestedRoute: 'http://localhost:1337/api/v1/measures/123/metadata?locale=en_US&session=fred',
            queryParams: {
                locale: 'en_US',
                session: 'fred'
            }
        }, null, 3);

        assert.equal(actual, expected);

    });


    it('decompile route', () => {

        let route = '/api/v1/measures/{{measureId}}/metadata?locale={{locale}}&session={{session}}';

        console.log(JSON.stringify(router.decompileRoute(route), null, 3));

    });



    it('required parameters route', (done) => {

        let routes = {
            '/api/v1/measures/{{measureId}}/metadata?locale={{locale}}&ticket={{session}}&friend={{friend}}&notrequired={notrequired}' : 'fnc'
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




    it('decompile multiple path params', () => {

        let route = '/api/v1/measures/{{measureId}}/{{friendlyId}}?locale={locale}&session={{session}}';
        let testUrl = 'http://localhost:1337/api/v1/measures/123/412/?locale=en_US&session=fred';

        let routes = {};
        routes[route] = 'fnc';

        console.log(JSON.stringify(router.decompileRoute(route), null, 3));

        const actual = JSON.stringify(ignore(router.conductor(routes)(testUrl)), null , 3);
        console.log(actual);
        const expected = JSON.stringify({
            pathParams: {
                measureId: '123',
                friendlyId: '412'
            },
            rail: 'fnc',
            requestedRoute: 'http://localhost:1337/api/v1/measures/123/412/?locale=en_US&session=fred',
            queryParams: {
                locale: 'en_US',
                session: 'fred'
            }
        }, null, 3);

        assert.equal(actual, expected);

    });



    it('decompile route validation test with path param and immediate query params', () => {

        let route = '/api/v1/measures/{{measureId}}?locale={locale}&session={{session}}';
        let testUrl = 'http://localhost:1337/api/v1/measures/123?locale=en_US&session=fred';

        let routes = {};
        routes[route] = 'fnc';

        console.log(JSON.stringify(router.decompileRoute(route), null, 3));

        const actual = JSON.stringify(ignore(router.conductor(routes)(testUrl)), null , 3);
        console.log(actual);
        const expected = JSON.stringify({
            pathParams: {
                measureId: '123'
            },
            rail: 'fnc',
            requestedRoute: 'http://localhost:1337/api/v1/measures/123?locale=en_US&session=fred',
            queryParams: {
                locale: 'en_US',
                session: 'fred'
            }
        }, null, 3);

        assert.equal(actual, expected);

    });



    it('decompile route validation test with path param and immediate path params with hyphens', () => {

        let route = '/api/v1/measures/{{measureId}}?locale={locale}&session={{session}}';
        let testUrl = 'http://localhost:1337/api/v1/measures/12-34?locale=en_US&session=fr-ed';

        let routes = {};
        routes[route] = 'fnc';

        console.log(JSON.stringify(router.decompileRoute(route), null, 3));

        const actual = JSON.stringify(ignore(router.conductor(routes)(testUrl)), null , 3);
        console.log(actual);
        const expected = JSON.stringify({
            pathParams: {
                measureId: '12-34'
            },
            rail: 'fnc',
            requestedRoute: 'http://localhost:1337/api/v1/measures/12-34?locale=en_US&session=fr-ed',
            queryParams: {
                locale: 'en_US',
                session: 'fr-ed'
            }
        }, null, 3);

        assert.equal(actual, expected);

    });

});