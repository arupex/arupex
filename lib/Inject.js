
class Inject {

    constructor (LogFactory, injectAbles) {
        this._LOG = new LogFactory('Arupex-Injector');

        this._LogFactory = LogFactory;
        this._dependencyTree = {};
        this._rawInjectAbles = injectAbles;

        this._rawInjectAbles = this.injectObject(this._rawInjectAbles);

        this.treeOfMap(injectAbles);
    }

    treeOfMap (map) {
        Object.keys(map).forEach((injectee) => {
            if (typeof map[injectee] === 'function') {
                this._dependencyTree[injectee] = Inject.getArgs(map[injectee]).filter(e=>e);
            }
        });
    }

    getDependencies() {
        return this._dependencyTree;
    }

    static isClass(obj) {
        return (Inject.getConstructor(obj) || '').toString().substring(0, 5) === 'class';
    }

    static getConstructor(obj) {
        return obj.constructor || obj.prototype.constructor;
    }


    static getArgs(func) {
        if(typeof func === 'function') {
            let args = Inject.isClass(func)?Inject.getConstructor(func).replace(/.*constructor/m,'').toString():func.toString()
                .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '')
                .replace(/=>.*$/mg, '')
                .replace(/=[^,]+/mg, '')
                .match(/\((.*)\)/);
            if (args) {
                return args[1].match(/([^\s,]+)/g) || [];
            }
        }
        return [];
    }

    injectArray(array) {
        return array.map( func => {
            return ((req, res, next) => {
                this._inject(func, Object.assign({req: req, next: next}, this._dependencyTree), Inject.getArgs(func));
            });
        });
    }

    aggregateInjector (initialInjectables, injectees, wrapper) {
        this.treeOfMap(injectees);

        injectees.forEach((injectee) => {
            initialInjectables = Object.assign({}, initialInjectables, this._inject(injectables, injectee, this._dependencyTree[injectee]));
        });
        return initialInjectables;
    }

    injectObject(object) {
        let injectables = this._rawInjectAbles;

        let runs = 0;
        let injectees = Object.keys(object);

        const MAX_RUNS = injectees.length * injectees.length;

        while((injectees.length > 0) && (MAX_RUNS > runs)){
            let injecteeName = injectees.shift();

            if (typeof object[injecteeName] === 'function') {

                injectables.LOG = new this._LogFactory(injecteeName);
                injectables.console = injectables.LOG;//so you can just inject console

                let dependencies = this._dependencyTree[injecteeName].map(e => injectables[e]);
                let allDependenciesResolved = (dependencies.length > 0)? dependencies.every(e => e): true;

                if(allDependenciesResolved) {
                    injectables[injecteeName] = this._inject(object[injecteeName], injectables, this._dependencyTree[injecteeName]);
                }
                else {
                    injectees.push(injecteeName);
                }
            }
            else {
                injectables[injecteeName] = object[injecteeName];
            }

            runs++;
        }

        if(injectees.length > 0) {
            injectees.forEach( injecteeName => {
                if (typeof object[injecteeName] === 'function') {

                    injectables.LOG = new this._LogFactory(injecteeName);
                    injectables.console = injectables.LOG;//so you can just inject console

                    let missingDependencies = this._dependencyTree[injecteeName].filter(e => !injectables[e]);
                    LOG.warn(`last fail injecting ${injecteeName} even though missing ${JSON.stringify(missingDependencies)}`);
                    injectables[injecteeName] = this._inject(object[injecteeName], injectables, this._dependencyTree[injecteeName]);
                }
            });
        }

        return injectables;
    }

    _inject(fnc, inj, args){
        let functionCallValue = {};

        if(typeof fnc === 'function') {
            const argArray = args.map(argName => {

                if (inj[argName]) {
                    return inj[argName]
                }

                this._LOG.critical(`you requested ${argName} but it is not available for injection`);

            });

            functionCallValue = fnc.apply(null, argArray);
        }
        return functionCallValue;
    }

    inject(func) {
        let result = {};
        if (typeof injectables === 'object') {
            if (typeof func === 'function') {
                result = this._inject(func);
            }

            if (typeof func === 'object') {
                if (Array.isArray(func)) {
                    result = this.injectArray(func);
                }
                else {
                    result = this.injectObject(func);
                }
            }
        }
        return result;
    }
}

module.exports = Inject;