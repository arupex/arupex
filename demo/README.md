# Anatomy of an Arupex Application

[![npm version](https://badge.fury.io/js/arupex.svg)](https://badge.fury.io/js/arupex)
[![dependencies](https://david-dm.org/arupex/areupex.svg)](http://github.com/arupex/arupex)
![Build Status](https://api.travis-ci.org/arupex/arupex.svg?branch=master) 
[![Donate](https://img.shields.io/badge/Donate-Arupex-green.svg)](https://pledgie.com/campaigns/31873)
![lifetimeDownloadCount](https://img.shields.io/npm/dt/arupex.svg?maxAge=25920000)

### What is Arupex?

Arupex is a Serverless/Server framework for NodeJS
It allows you to build a serverless application for your needs, but also allows you to wrap that with a http server if need be

## Goals
- Making Testing easier on Developers
 - Making Mocking a thing of the past
 - Simplifying Workflows
 - Making Dependency Injection simple and elegant


# Examples - [download example project](https://github.com/arupex/arupex-demo/archive/master.zip)
 
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
    
    
[Learn More About Environments](./docs/Environments.md)

----

### Routes

Routes allows you to have a http server associated with your serverless functions
 our route syntax allows you to include parameters in the route both {{required}} and {optional parameters}
 which will be automatically injected into the 'event' of your function

    module.exports = {
        '/api/v1/ping?locale={{locale}}&time={optionalTime}' : 'FunctionName'
    };

[Learn More About Routes](./docs/Routes.md)


### Functions - are essentially controllers help call underlying business code (Services)
    
    // Note that currencyConversion is a Service and res is a container for responses, these are injected by name
    module.exports = function(currencyConversion, res){
        currencyConversion.getRates().then((data) => {
            res.ok(data);
        }, (err) => {
            res.badRequest(err);
        });
    };

[Learn More About Functions](./docs/Functions.md)

### Hooks - are injectable to Policies/Services/DataServices

    //useful for abstracting event, or creating loggers, or other things you might need injected into DataService
    module.exports = function(event, context){
        return {
            getUserId : () => { return event.userId; }
        };
    };

[Learn More About Hooks](./docs/Hooks.md)

### Policies - are good for checking parameters / checking authentication / authorization
    
    //works similarly to express middlware, however you can inject hooks/services
    module.exports = function(req, res, next, iamService, userHook){
        iamService.auth(userHook.getUserId()).then((userData) => {
            userHook.setData(userData);
            next();
        }).catch(() => {
            res.fail();
        });
    };

[Learn More About Policies](./docs/Policies.md)

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
    
[Learn More About Services](./docs/Services.md)

### DataServices - are mockable services which call out to other external components

##### Example 1:
    module.exports = [
        { getLatestBase : 'GET latest?base={{base}}' },//you can force the output function name
        'latest?symbols={{symbols}}'//you can let clientBuilder determine the name of the function
    ];
    
    //allows you to determine values for variables via other injectable services
    module.exports.injector = function(context, UserService){
    
        return {
            baseUrl : 'http://api.fixer.io/',
            base: UserService.getCurrency(),
            symbols : UserService.getOtherCurrency()
        };
    
    };
##### Example 2:
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

[Learn More About DataServices](./docs/DataServices.md)

### Responses - are an abstraction for the underlying callback it be a callback to AWS lambda/Gateway or to NODE.js http socket


[Learn More About Responses](./docs/Responses.md)

### Workers - allow you to run tasks

##### Interval-Workers

Workers are great if you want a task to happen asynchronously in the background without user/client triggering
if you wanted to create a 'cron' worker you would go about this similarly to

Example:

    module.exports = function() {
        let now = new Date();
        if(now.getHour() === 6 && now.getMinute() === 30) {//only acts at 6:30 am
            //do things
        }
    };
    module.exports.interval = 60000;//every minute

[Learn More About Workers](./docs/Workers.md)

# Mocks

Arupex simplifies the mocking process by generating mocks for you based on a schema generated from your actual code!

[Learn More About Mocks](./docs/Mocking.md)

### Need More Help? Open an Issue [Here](https://github.com/arupex/arupex/issues/new) or @dirwin517
### Want to improve this documentation? [Do a Pull Request](https://github.com/arupex/arupex-demo)
