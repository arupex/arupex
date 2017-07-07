#!/usr/bin/env node

require('../arupex').interceptors.http.start(process.env.PORT || 1337, {
    dir: process.cwd()
});
