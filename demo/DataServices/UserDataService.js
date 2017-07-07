/**
 * Created by daniel.irwin on 6/25/17.
 */
module.exports = function(customHook) {
    return {
        getCurrency: function () {
            return Promise.resolve('USD');
        },
        getOtherCurrency: function () {
            return Promise.resolve(customHook.getCurrencyCode());
        }
    };
};

//cannot be mocked
module.exports.overrideable = false;
