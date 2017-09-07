/**
 * Created by daniel.irwin on 5/24/17.
 */
module.exports = function tracer(cb, recursive, observer, configuration) {

    function callback(){
        if(typeof cb === 'function') {
            // arguments[arguments.length] = traceRoute();
            // cb.apply(this, arguments);
            //  type,       set/get     ,  old/current-value, new-value/undefined,        trace
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
                    return tracerClosure(data);
                });
            }
            if(typeof observer === 'function'){
                observer('completed', name);
            }
            return tracerClosure(value);
        };
    }

    function traceProperty(obj, propertyName, value){
        return function closure() {
            let v = value;
            return Object.defineProperty(obj, propertyName, {
                enumerable: true,
                get: function () {
                    callback('property', propertyName + '.get', v);
                    return (v);
                },
                set: function (newValue) {
                    callback('property', propertyName + '.set', v, newValue);
                    v = newValue;
                }
            });
        }();
    }

    function traceRoute(){
        return new Error('TRACE-ROUTE').stack.split('\n').slice(1).find((v)=> (v.indexOf('trace.js') === -1));
    }

    function traceArray(array){
        return array.map( (el) => {
            return tracerClosure(el);
        });
    }

    function traceObject (input) {
        if(!input || typeof input !== 'object'){
            return {};
        }
        if(typeof input.ignoreInstrumentation === 'boolean' && input.ignoreInstrumentation){
            return input;
        }
        return Object.keys(input).reduce((acc, property) => {

            //sort circuit on blacklist properties
            if(typeof configuration === 'object' && typeof configuration.propertyBlackList === 'object' && configuration.propertyBlackList[property]){
                acc[property] = input[property];
            }
            else {
                switch (typeof input[property]) {
                    case 'function':
                        acc[property] = traceFunction(property, input[property]);
                        break;
                    case 'object':
                        if (input[property]) {//make sure its not null
                            if (Array.isArray(input)) {
                                acc[property] = recursive ? traceArray(input[property]) : input[property];
                            }
                            else {
                                acc[property] = recursive ? tracerClosure(input[property]) : input[property];
                            }
                        }
                        else {
                            acc[property] = input[property];
                        }
                        break;
                    case 'string':
                    case 'number':
                    case 'boolean':
                        acc = traceProperty(acc, property, input[property]);
                        break;
                    case 'undefined':
                        acc[property] = input[property];
                        break;
                    default:
                        acc = traceProperty(acc, property, input[property]);
                }
            }
            return acc;
        }, {});
    }

    function tracerClosure(input) {

        //sort circuit
        if(input && input.ignoreInstrumentation){
            return input;
        }

        if (input) {
            if (typeof input === 'function') {
                return traceFunction(null, input);
            }
            else if (typeof input === 'object') {
                if (Array.isArray(input)) {
                    return traceArray(input);
                }
                else {
                    return traceObject(input);
                }
            }
            return (input);
        }
        return input;
    }

    return function(input){
        return tracerClosure(input);
    };
};