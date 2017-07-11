/**
 * Created by daniel.irwin on 5/24/17.
 */
module.exports = function tracer(cb, recursive, observer) {

    function callback(){
        if(typeof cb === 'function') {
            // arguments[arguments.length] = traceRoute();
            // cb.apply(this, arguments);
            cb(arguments[0], arguments[1], arguments[2], arguments[3], traceRoute());
        }
    }

    function traceFunction(name, func) {
        return function traced() {
            callback('function', name || func.name, arguments);
            if(typeof observer === 'function'){
                observer('start', name);
            }
            let value = func.apply(this, arguments);

            //If Promise wait till its resolved
            if(value && typeof value.then === 'function'){
                return value.then(function(data){
                    if(typeof observer === 'function'){
                        observer('completed', name);
                    }
                    return data;
                });
            }
            if(typeof observer === 'function'){
                observer('completed', name);
            }
            return value;
        };
    }

    function traceProperty(obj, propertyName, value){
        return function closure() {
            let property = value;

            Object.defineProperty(obj, propertyName, {
                get: function () {
                    callback('property', propertyName+'.get', property);
                    return property;
                },
                set: function (newValue) {
                    callback('property', propertyName+'.set', newValue, property);
                    property = newValue;
                }
            });

        }();
    }

    function traceRoute(){
        return new Error('TRACE-ROUTE').stack.split('\n').slice(1).find((v)=> (v.indexOf('trace.js') === -1));
    }

    function tracerClosure(input) {

        if (typeof input === 'function') {
            return traceFunction(null, input);
        }
        else if (typeof input === 'object') {

            return Object.keys(input).reduce((acc, property) => {
                switch(typeof input[property]){
                    case 'function':
                        acc[property] = traceFunction(property, input[property]);
                        break;
                    case 'object':
                        acc[property] = recursive?tracerClosure(input[property]):input[property];
                        break;
                    case 'string':
                    case 'number':
                    case 'boolean':
                        traceProperty(acc, property, input[property]);
                        break;
                    default:
                        acc[property] = input[property];
                }
                return acc;
            }, {});

        }
    }

    return function(input){
        return tracerClosure(input);
    };
};