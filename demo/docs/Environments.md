### Environments
 - This is where you put configuration data for things like data services (connection strings)
 - For instances if you have a CurrencyDataService you might have the following configuration
   
Example:

    module.exports = {
        CurrencyDataService : {
            baseUrl : 'http://api.fixer.io/',
            respondWithProperty: 'rates'
        }
    };
    