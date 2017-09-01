module.exports = function(res, currencyConversion, Request){

    currencyConversion.getDay(Request.getDate()).then((data) => {
        res.ok(data);
    }, (err) => {
        res.badRequest(err);
    });

};