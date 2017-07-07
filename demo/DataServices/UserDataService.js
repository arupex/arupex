/**
 * Created by daniel.irwin on 6/25/17.
 */
module.exports = function(customHook) {
    return {
        getCurrency: function () {
            return 'USD';
        },
        getOtherCurrency: function () {
            return customHook.getCurrencyCode();
        }
    };
};

//cannot be mocked
module.exports.overrideable = false;