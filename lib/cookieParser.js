/**
 * Created by daniel.irwin on 6/25/17.
 */
'use strict';
module.exports = function getCookiesFromHeader(headers) {

    if (!headers || !headers.cookie) {
        return {};
    }

    return headers.cookie.split(';').reduce((cookies, cookie) => {
        let parts = cookie.split('=');
        let key = parts.shift().trim();
        if (key !== '') {
            cookies[key] = decodeURI(parts.join('='));
        }
        return cookies;
    }, {});

};
