/**
 * Created by daniel.irwin on 5/22/17.
 */

const HyperMark = require('../hypermark/index.js');

const partsOfApp = [
    'DataServices',
    'DataServiceUtils',
    'Environments',
    'Hooks',
    'Policies',
    'Responses',
    'Services',
    'Workers',
    'Core',
    'Models',
    'Functions'
];

const LoggerFactor = require('./lib/LoggerFactory');
const loggerFactory = new LoggerFactor({logLevel : 'info'});
const logger = loggerFactory.getLogger();

let LOG = new logger('Lambda-Interceptor', { level : (process.env.LOG_LEVEL || 'warn') });

const directoryLoader = require('./lib/multiDirLoader');
const Injector = require('./lib/Inject');

const dir = process.cwd();


const routeAnalyzer = require('./lib/routeAnalyzer');
const pipeline = require('./lib/pipeline');
const interceptorUtils = require('./lib/interceptorUtils');
let structured = require('./lib/structured');
let clientBuilder = require('./lib/clientBuilder');
const docGenerator = require('./lib/docGenerator');
const initializedRouteAnalyzer = new routeAnalyzer(logger);

let lib = {
    asyncize : require('./lib/asyncize'),
    clientBuilder : clientBuilder,
    codeGenerator : require('./lib/codeGenerator'),
    cookieParser : require('./lib/cookieParser'),
    docGenerator : new docGenerator(initializedRouteAnalyzer),
    i18n : require('./lib/i18n'),
    injector : Injector,
    interceptorUtils : new interceptorUtils(Injector, structured, clientBuilder, logger),
    logger : logger,
    meter : require('./lib/MeterFactory'),
    metricTracer : require('./lib/metricTracer'),
    multiDirLoader : directoryLoader,
    pipeline : new pipeline(logger),
    // requireDirectory : require('./lib/requireDirectory'),
    routeAnalyzer : initializedRouteAnalyzer,
    structured : structured,
    trace : require('./lib/Tracer')
};

let utils = lib.interceptorUtils;

let app = directoryLoader( partsOfApp.map( e=> `${dir}/${e}/`) );//allow client to pass in own app structure

//Pre pop all parts if missing
if (typeof app === 'object' && typeof app.Functions === 'object') {//if you have no 'lambda' functions your going to have a bad time

    utils.fillEmpty(app, partsOfApp, null, (name) => {
        LOG.warn(`no ${name} where found`);
    });
}
else {
    //panic
    LOG.crucial(`failed to find app missing app=${typeof app === 'object'} missing functions=${typeof app.Functions === 'object'}`);
}


let activeEnvironment = (app.Environments || {})[process.env.ENVIRONMENT || 'dev'];
if (typeof activeEnvironment !== 'object') {
    LOG.warn('error no active environment to set the active environment set the ENVIRONMENT variable - default:dev\n');
    activeEnvironment = {};//fix it sort of ?
}
//reconstruct Policies into array from map losing the policies name in the process
let policiesArray = Object.keys(app.Policies || {}).reduce((acc, v) => {
    acc.push(app.Policies[v]);
    return acc;
}, []);

let injectableDataServices = utils.clientBuild(app.DataServices, activeEnvironment);

function tryRoutes () {
    try {
        return require(`${process.cwd()}/routes.js`);
    }
    catch(e){
        return {};
    }
}

let routes = tryRoutes();

const urls = Object.keys(routes);
let swagger = lib.docGenerator.generateFromUrls(urls, routes.headers);


let outerInjectables = utils.aggregateInjector({
    arupexlib : lib,
    logger: lib.logger,
    env: activeEnvironment,
    environment: activeEnvironment,
    tracer: lib.tracer,
    meter: lib.meter,
    i18n: lib.i18n,
    swagger: swagger,
    directoryLoader : directoryLoader
},[
    app.Core,
    app.Models
]);

const injectorInstance = new Injector(logger, {
    Auditor : HyperMark.Auditor,
    app : app,
    activeEnvironment: activeEnvironment,
    swagger: swagger,
    directoryLoader : directoryLoader,
    injectableDataServices: injectableDataServices,
    lib : lib,
    utils : utils,
    outerInjectables : outerInjectables,
    logger : logger
});

const LambdaInterceptor = injectorInstance.inject(require('./interceptors/lambdas'));

module.exports = {
    interceptors : {
        advancedHttp : require('./interceptors/advancedHttp'),
        http : require('./interceptors/http'),
        lambdas : LambdaInterceptor.pipelines,
        mockServer : require('./interceptors/mockServer')
    },
    edge : LambdaInterceptor,
    lib : lib
};