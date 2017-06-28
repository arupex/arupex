/**
 * Created by daniel.irwin on 6/25/17.
 */
module.exports = {
    getCurrency : function (){
        return 'USD';
    },
    getOtherCurrency : function(){
        return 'JPY';
    }
};

//cannot be mocked
module.exports.overrideable = false;