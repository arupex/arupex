/**
 * Created by daniel.irwin on 6/26/17.
 */
module.exports = function InjectableClientFactory(client, configFunction) {

    let injector = require('./injector');

    return Object.keys(client).reduce( (acc, v) => {

        acc[v] = function injectableClientFunction(injectables){
            return function clientFunc() {
                if (typeof configFunction === 'function') {
                    return client[v](injector(injectables, configFunction));
                }
                return client[v](injector(injectables, configFunction));
            };
        };

        return acc;
    }, {});

};