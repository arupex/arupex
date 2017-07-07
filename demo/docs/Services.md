
### Services - are internal components that handle data manipulation and handeling business logic

    //creates a service which takes in a CurrencyDataService and a UserDataService
    module.exports = function(CurrencyDataService, UserDataService){
    
        function getRates(){
            return CurrencyDataService.getLatestBase({ base : UserDataService.getOtherCurrency() });
        }
    
        return {
            getRates : getRates
        };
    };
    