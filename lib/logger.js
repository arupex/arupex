/**
 * Created by daniel.irwin on 6/6/17.
 */
function LoggerFactory(loggerName, hooks){

    const levels = ['silly', 'verbose', 'debug', 'info', 'warn', 'error', 'critical'];

    hooks = hooks || {};

    this.name = loggerName;
    this.hooks = hooks;

    this.outStream = (hooks.outStream || process.stdout);
    this.errStream = (hooks.errStream || process.stderr);

    let messageKey = hooks.messageKey || 'message';

    let slicer = this.slicer = hooks.slicer || function(objectOrArrayOrString){
        if(typeof objectOrArrayOrString === 'object' && !Array.isArray(objectOrArrayOrString)){
            let keys = Object.keys(objectOrArrayOrString);
            let numbChunks = Math.ceil(keys.length / 255);
            let current = {};
            return keys.reduce((acc, key, i)=> {
                if((i+1) % numbChunks === 0){
                    acc.push(current);
                    current = {};
                }
                current[key] = objectOrArrayOrString[key];
                return acc;
            }, []);
        }

        if(typeof objectOrArrayOrString === 'string' || Array.isArray(objectOrArrayOrString)) {
            let chunks = [];
            let numbChunks = Math.ceil(objectOrArrayOrString.length / 255);

            for(let i = 0; i < numbChunks * 255; i += 255){
                chunks.push(objectOrArrayOrString.slice(i, i + 255));
            }

            return chunks;
        }
        return [objectOrArrayOrString];
    };

    this.devFormat = hooks.devFormat || function(level, args){
        let string = level + ' ';

        for(let x = 0; x < args.length; ++x) {
            string += args[x];
        }

        return [string];
    };


    this.prodFormat = hooks.prodFormat || function(level, args){
        let data = {
            timestamp : new Date().toISOString().replace('Z','+00:00'),
            logger_name : loggerName,
            level : level

        };
        let messages = [];
        for(let i = 0; i < args.length; ++i){
            /* jshint ignore:start */
            slicer(args[i]).forEach((slice) => {
                data[messageKey] = slice;
                messages.push(JSON.stringify(data, null, 0));
            });
            /* jshint ignore:end */
        }

        return messages;
    };

    let minLevel = levels.indexOf(this.level = hooks.level || 'info');


    this.format = function(){
        let level = arguments[0];
        if(levels.indexOf(level) >= minLevel) {
            if (process.env.NODE_ENV === 'prod') {
                return this.prodFormat(level, arguments[1]);
            }
            else {
                return this.devFormat(level, arguments[1]);
            }
        }
        return [];
    };

}

LoggerFactory.prototype.silly = function(){
    this.format('silly', arguments).forEach((message) => {
        this.outStream.write(message);
        this.outStream.write('\n');
    });
};

LoggerFactory.prototype.info = function(){
    this.format('info', arguments).forEach((message) => {
       this.outStream.write(message);
        this.outStream.write('\n');
    });
};

LoggerFactory.prototype.error = function(){
    this.format('error', arguments).forEach((message) => {
        this.errStream.write(message);
        this.errStream.write('\n');
    });
};

LoggerFactory.prototype.warn = function(){
    this.format('warn', arguments).forEach((message) => {
        this.outStream.write(message);
        this.outStream.write('\n');
    });
};

LoggerFactory.prototype.verbose = function(){
    this.format('verbose', arguments).forEach((message) => {
        this.outStream.write(message);
        this.outStream.write('\n');
    });
};

LoggerFactory.prototype.debug = function(){
    this.format('debug', arguments).forEach((message) => {
        this.outStream.write(message);
        this.outStream.write('\n');
    });
};

LoggerFactory.prototype.critical = function(){
    this.format('critical', arguments).forEach((message) => {
        this.errStream.write(message);
        this.errStream.write('\n');
    });
};



module.exports = LoggerFactory;