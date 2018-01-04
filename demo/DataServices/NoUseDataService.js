'use strict';

module.exports = function() {

    return {
      test : function(thing){
        return 'hi';
      }
    };

};
//this does not get used but proves out injector failure on non env services