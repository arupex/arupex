/**
 * Created by daniel.irwin on 5/24/17.
 */
 class Tracer {

     constructor({cb, recursive, observer, configuration, audit}) {
        this._cb = cb;
        this._recursive = recursive;
        this._observer = observer;
        this._configuration = configuration;
        this.audit = audit;
     }

     _callback(){
         const tracing = this.traceRoute();

         if(typeof this.audit === 'function') {
            this.audit({
                type : arguments[0],
                set_get : arguments[1],
                old_value : arguments[2],
                new_value : arguments[3],
                trace : tracing
            });
        }

        if(typeof this._cb === 'function') {
            // arguments[arguments.length] = traceRoute();
            // cb.apply(this, arguments);
            //  type,       set/get     ,  old/current-value, new-value/undefined,        trace
            this._cb(arguments[0], arguments[1], arguments[2], arguments[3], tracing);
        }
    }

    traceFunction(name, func) {
        return () => {
            this._callback('function', name || func.name, arguments);
            if(typeof this._observer === 'function'){
                this._observer('start', name);
            }
            let value = func.apply(this, arguments);

            //If Promise wait till its resolved
            if(value && typeof value.then === 'function'){
                return value.then((data) => {
                    if(typeof this._observer === 'function'){
                        this._observer('completed', name);
                    }
                    return this.trace(data);
                });
            }
            if(typeof this._observer === 'function'){
                this._observer('completed', name);
            }
            return this.trace(value);
        };
    }

    traceProperty(obj, propertyName, value){
        return function closure() {
            let v = value;
            return Object.defineProperty(obj, propertyName, {
                enumerable: true,
                get:  () => {
                    this._callback('property', propertyName + '.get', v);
                    return (v);
                },
                set: (newValue) => {
                    this._callback('property', propertyName + '.set', v, newValue);
                    v = newValue;
                }
            });
        }();
    }

    traceRoute(){
        return new Error('TRACE-ROUTE').stack.split('\n').slice(1).find((v)=> (v.indexOf('trace.js') === -1));
    }

    traceArray(array){
        return array.map( (el) => {
            return this.trace(el);
        });
    }

    traceObject (input) {
        if(!input || typeof input !== 'object'){
            return {};
        }
        if(typeof input.ignoreInstrumentation === 'boolean' && input.ignoreInstrumentation){
            return input;
        }
        return Object.keys(input).reduce((acc, property) => {

            //sort circuit on blacklist properties
            if(typeof this._configuration === 'object' &&
                typeof this._configuration.propertyBlackList === 'object' &&
                this._configuration.propertyBlackList[property]){
                acc[property] = input[property];
            }
            else {
                switch (typeof input[property]) {
                    case 'function':
                        acc[property] = this.traceFunction(property, input[property]);
                        break;
                    case 'object':
                        if (input[property]) {//make sure its not null
                            acc = this.traceProperty(acc, property, input[property]);
                            // if (Array.isArray(input)) {
                            //     acc[property] = this._recursive ? this.traceArray(input[property]) : input[property];
                            // }
                            // else {
                            //     acc[property] = this._recursive ? this.trace(input[property]) : input[property];
                            // }
                        }
                        else {
                            acc[property] = input[property];
                        }
                        break;
                    case 'string':
                    case 'number':
                    case 'boolean':
                        acc = this.traceProperty(acc, property, input[property]);
                        break;
                    case 'undefined':
                        acc[property] = input[property];
                        break;
                    default:
                        acc = this.traceProperty(acc, property, input[property]);
                }
            }
            return acc;
        }, {});
    }

    trace(input) {

        //sort circuit
        if(input && input.ignoreInstrumentation){
            return input;
        }

        if (input) {
            if (typeof input === 'function') {
                return this.traceFunction(null, input);
            }
            else if (typeof input === 'object') {
                if (Array.isArray(input)) {
                    return this.traceArray(input);
                }
                else {
                    return this.traceObject(input);
                }
            }
            return (input);
        }
        return input;
    }
};

module.exports = Tracer;