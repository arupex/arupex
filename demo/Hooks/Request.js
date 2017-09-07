module.exports = function(event){

  return {

      getDate : () => {
          return event.date;
      },

      getCurrency : () => {
          return event.currency;
      }
  }

};