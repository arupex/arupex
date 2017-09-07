/**
 * Created by daniel.irwin on 6/25/17.
 */
module.exports = function(data, callback, context){
  // console.log('arupexAudit', context.arupexAudit);
    callback(null, {
      statusCode : 200,
      body : JSON.stringify({
        code : 200,
        message : 'ok',
        data : data
      }, null, 3)
  });
};