/**
 * Created by daniel.irwin on 6/25/17.
 */
module.exports = function(CurrencyDataService, UserDataService){

    function getRates(){
        return UserDataService.getOtherCurrency().then(base => {
            return CurrencyDataService.getLatestBase({base: base});
        });
    }

    return {
        getRates : getRates
    };

};