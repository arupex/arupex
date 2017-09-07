/**
 * Created by daniel.irwin on 6/25/17.
 */
module.exports = function(CurrencyDataService, UserDataService, Request){

    function getRates(){
        return UserDataService.getOtherCurrency({}).then(base => {
            return CurrencyDataService.getLatestBase({base: base});
        });
    }

    function getDay (day){
        return CurrencyDataService.getDay({
            date : day,
            symbols : Request.getCurrency()
        });
    }

    return {
        getRates : getRates,
        getDay : getDay
    };

};