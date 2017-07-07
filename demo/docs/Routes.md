
### Routes

Routes allows you to have a http server associated with your serverless functions
 our route syntax allows you to include parameters in the route both {{required}} and {optional parameters}
 which will be automatically injected into the 'event' of your function

    module.exports = {
        '/api/v1/ping?locale={{locale}}&time={optionalTime}' : 'FunctionName'
    };
