/**
 * Created by daniel.irwin on 6/17/17.
 */
module.exports = [
    { getDay : '/{{date}}?symbols={{symbols}}'},
    { getLatestBase : 'GET latest?base={{base}}' },//you can force the output function name
    'latest?symbols={{symbols}}'//you can let clientBuilder determine the name of the function
];