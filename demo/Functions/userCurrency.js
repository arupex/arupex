/**
 * Created by daniel.irwin on 6/27/17.
 */
module.exports = function(currencyConversion, res){
    currencyConversion.getRates().then((data) => {
        res.ok(data);
    }, (err) => {
        res.badRequest(err);
    });
};