### Hooks - are injectable to Policies/Services/DataServices

    //useful for abstracting event, or creating loggers, or other things you might need injected into DataService
    module.exports = function(event, context){
        return {
            getUserId : () => { return event.userId; }
        };
    };