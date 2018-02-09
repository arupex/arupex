/**
 * Created by daniel.irwin on 5/22/17.
 */


module.exports = {
    interceptors : {
        advancedHttp : require('./interceptors/advancedHttp'),
        http : require('./interceptors/http'),
        lambdas : require('./interceptors/lambdas'),
        mockServer : require('./interceptors/mockServer')
    },
    lib : {
        asyncize : require('./lib/asyncize'),
        clientBuilder : require('./lib/clientBuilder'),
        codeGenerator : require('./lib/codeGenerator'),
        cookieParser : require('./lib/cookieParser'),
        docGenerator : require('./lib/docGenerator'),
        i18n : require('./lib/i18n'),
        injector : require('./lib/injector'),
        interceptorUtils : require('./lib/interceptorUtils'),
        logger : require('./lib/logger'),
        meter : require('./lib/meter'),
        metricTracer : require('./lib/metricTracer'),
        multiDirLoader : require('./lib/multiDirLoader'),
        pipeline : require('./lib/pipeline'),
        requireDirectory : require('./lib/requireDirectory'),
        routeAnalyzer : require('./lib/routeAnalyzer'),
        structured : require('./lib/structured'),
        trace : require('./lib/trace')
    }
};