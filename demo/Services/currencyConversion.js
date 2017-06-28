/**
 * Created by daniel.irwin on 6/25/17.
 */
module.exports = function(CurrencyDataService, UserDataService){

    function getRates(){
        return CurrencyDataService.getLatestBase({ base : UserDataService.getOtherCurrency() });
    }

    return {
        getRates : getRates
    };

};