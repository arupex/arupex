/**
 * Created by daniel.irwin on 6/25/17.
 */

/**
 * Returns a Locale Sensative Compare Function for sorting
 * (because its not built into js but everyone should use one)
 * this also tries to optimize by using a Collator
 * if availible which will increase performance 10/100x or so
 *
 * @param locale such as 'en_US', 'en', 'en-us'
 * @returns {*}
 */
module.expots = (function() {
    const intlExists = typeof Intl === 'object';
    const collatorExists = typeof Intl.Collator === 'function';
    const numberFormatExists = typeof Intl.NumberFormat === 'function';

    return {
        sort: function intlSort(locale) {

            let miniLocale = locale ? locale.substr(0, 2) : 'en';

            if (intlExists && collatorExists) {
                try {
                    return new Intl.Collator(miniLocale, {
                        usage: 'sort'
                    }).compare;
                }
                catch (e) {
                    return new Intl.Collator('en', {
                        usage: 'sort'
                    }).compare;
                }
            }
            return (a, b) => {
                try {
                    return a.localeCompare(b, miniLocale);
                }
                catch (e) {
                    return a.localeCompare(b);
                }
            };
        },

        string: function (map, locale) {
            return map[locale] || map.en_US;//fallback to en_US
        },

        number : function(number, locale){
            if(!numberFormatExists){
                return number;
            }
            try {
                return Intl.NumberFormat(locale).format(number);
            }
            catch (e) {
                return Intl.NumberFormat('en').format(number);
            }

        }
    };
})();