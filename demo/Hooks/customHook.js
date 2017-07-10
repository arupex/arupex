/**
 * Created by daniel.irwin on 6/29/17.
 */
module.exports = function(event, context){
    return {
      getCurrencyCode : function(){
          return event.currency || (event.cookies?event.cookies.base:null) || (event.queryParams?event.queryParams.base:null);
      }
    };
};