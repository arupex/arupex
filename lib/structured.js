/**
 * Created by daniel.irwin on 6/6/17.
 */
module.exports = {

    /**
     * Lazy Extend Function
     * @param obj1
     * @param obj2
     * @returns {*}
     */
    extend : function(obj1, obj2){
        if(obj2) {
            return Object.keys(obj2).reduce((acc, key) => {
                if (key) {
                    acc[key] = obj2[key];
                }
                return acc;
            }, obj1);
        }
        return obj1;
    },

    /**
     * Turns a Map of "Services" with Methods into a Map of Services
     * that have a Map of Method Names to structured paths
     * ie. 'MeasuresService.getData.error'
     *
     * @param object
     * @param firstParent
     * @param path
     * @returns {*}
     */
    toStructure : function (object, firstParent, path, depth) {
        if(typeof depth === 'undefined'){
            depth = 1;
        }
        if(depth < 0){
            return;
        }

        if(object && typeof object === 'object'){
            return Object.keys(object).reduce((acc, key) => {
                if(key) {
                    if (firstParent && !acc[firstParent]) {
                        acc[firstParent] = {};
                    }

                    if (typeof object[key] === 'function') {
                        if (firstParent) {
                            acc[firstParent][key] = (path ? path + '.' : '') + key;
                        }
                        else {
                            acc[key] = (path ? path + '.' : '') + key;
                        }

                    }
                    else if (object[key] && typeof  object[key] === 'object') {
                        this.extend(acc, this.toStructure(object[key], firstParent ? firstParent : key, (path ? path + '.' : '') + key, depth-1));
                    }
                }
                return acc;
            }, {});
        }
        return {};
    },
    
    toGenerator : function (serviceMap) {

        let struct = module.exports.toStructure(serviceMap);//short cut to structure!

        function addAccessors(injectionPoint, key){
            injectionPoint[key] = {
                setSuccess: function(ok) {
                    this.data = ok;
                    this.error = false;
                },
                setFail: function(fail) {
                    this.error = fail;
                },
                setSuccessByQuery : function (query, data){
                    this.data = false;
                    this.error = false;
                    this.query[query] = data;
                },
                data: false,
                query : false,
                error: true//default to erroring unless setSuccess is called!
            };
        }

        return Object.keys(struct).reduce((acc, key) => {

            if(typeof struct[key] === 'string'){
                addAccessors(acc, key);
            }
            else if(typeof struct[key] === 'object'){
                acc[key] = Object.keys(struct[key]).reduce( (subAcc, subKey) => {
                    if(typeof struct[key][subKey] === 'string'){
                        addAccessors(subAcc, subKey);
                    }
                    return subAcc;
                }, {});
            }

            return acc;
        }, { fncVarReplacements : {} });

    },
    
    toImplentation : function (struct) {
        let asyncize = require('./asyncize');

        if(typeof struct === 'object') {
            return Object.keys(struct).reduce((acc, key) => {
                if (key) {
                    let innerStructReference = struct[key];
                    if(key === 'data' && innerStructReference && !struct.error){
                        return asyncize.conform(innerStructReference);
                    }
                    else if(key === 'query' && innerStructReference && !struct.error){
                        return asyncize.conform(undefined, undefined, innerStructReference);
                    }
                    else if(key === 'error' && innerStructReference && !struct.data){
                        return asyncize.conform(undefined, innerStructReference);
                    }
                    else if(key === 'query' && innerStructReference && !struct.error){//if you have multiple calls
                        return asyncize.async(undefined, undefined, innerStructReference);
                    }
                    else if (typeof innerStructReference === 'object') {
                        acc[key] = this.toImplentation(innerStructReference, key);
                    }
                }
                return acc;

            }, {});
        }
    }
};