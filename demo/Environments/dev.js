/**
 * Created by daniel.irwin on 6/17/17.
 */
module.exports = {

    CurrencyDataService : {
        baseUrl : 'http://api.fixer.io/',
        respondWithProperty: 'rates',
        cacheTtl : 10000//identical requests within 10seconds will respond from memory
    }

};