/**
 * Created by daniel.irwin on 5/24/17.
 */

describe('tracer', () => {
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

        let tracedVar = tracer(testVar);

        tracedVar.testFunc('fred');

        tracedVar.testObj.testFunc2('gary');

        tracedVar.testProperty.a = 7;

        if(tracedVar.testProperty.b){
            //do something
        }

    });

    it('promises', (done) => {
        let r = {
            h : (a) => {
                return new Promise( (resolve) => {
                    resolve({
                        a : a,
                        b : 3
                    });
                })
            }
        };
        let traced = tracer(r);

        traced.h(7).then((v) => {
            if(v.a === 7){//we want a trace on access to v.a
                done();
            }
        })

    });


});