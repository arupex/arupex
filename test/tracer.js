/**
 * Created by daniel.irwin on 5/24/17.
 */

describe('tracer', () => {

    it('object with non func properties recursive', () => {

        let testVar = {
            testFunc: function (arg1, arg2) {

            },
            testProperty: {
                a: 2,
                b: 'str'
            },
            testObj: {
                testFunc2: function (arg1, arg2) {

                }
            }
        };


        let tracer = require('../lib/trace')((type, traceName, value, other, traceRoute) => {
            console.log('\ttype:\t', type);
            console.log('\twho:\t', traceName);
            if(!other){
                console.log('\tIs:\t', value);
            }
            else{
                console.log('\tWas:\t', value);
            }
            if(other){
                console.log('\tIs:\t', other ? other : '')
            }
            console.log('\tAt:\t', traceRoute);
            console.log('\n');
        }, true);

        let tracedVar = tracer(testVar);

        tracedVar.testFunc('fred');

        tracedVar.testObj.testFunc2('gary');

        tracedVar.testProperty.a = 7;

        if(tracedVar.testProperty.b){
            //do something
        }

    });


});