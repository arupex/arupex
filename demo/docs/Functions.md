
### Functions - are essentially controllers help call underlying business code (Services)
    
    // Note that currencyConversion is a Service and res is a container for responses, these are injected by name
    module.exports = function(currencyConversion, res){
        currencyConversion.getRates().then((data) => {
            res.ok(data);
        }, (err) => {
            res.badRequest(err);
        });
    };