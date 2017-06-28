/**
 * Created by daniel.irwin on 6/25/17.
 */
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