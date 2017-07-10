
### Responses - are an abstraction for the underlying callback it be a callback to AWS lambda/Gateway or to NODE.js http socket

####  A 400 response might look like this if using AWS Api gateway

    module.exports = function(data, callback){
        callback(null, {
            statusCode : 400,
            body : JSON.stringify({
                code : 400,
                message : 'bad',
                data : data
            }, null, 3)
        });
    };
    
##### Note how data and callback are the parameters
    Data is assumed as the only real parameter to a response call
    callback is injected using the injector internally
    other injectables are injectable via putting them in the function signature! (not best practice with responses though)