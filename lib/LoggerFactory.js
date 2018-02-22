/**
 * Created by daniel.irwin on 6/6/17.
 */

class LoggerFactory {

    constructor(hooks) {
        hooks = hooks || {};
        this.hooks = hooks;
    }

    getLogger(inHooks) {
        const hooks = inHooks || this.hooks;

        return class Logger {
            constructor(loggerName) {

                const levels = ['silly', 'verbose', 'debug', 'info', 'warn', 'error', 'critical', 'crucial'];

                let self = this;
                this.name = loggerName;
                this.prettyFormat = false;

                this.outStream = (hooks.outStream || process.stdout);
                this.errStream = (hooks.errStream || process.stderr);

                function traceRoute() {
                    return new Error('TRACE-ROUTE').stack.split('\n').slice(1).find((v) => (v.indexOf('logger.js') === -1));
                }

                let messageKey = hooks.messageKey || 'message';

                let slicer = this.slicer = hooks.slicer || function (objectOrArrayOrString) {
                    if (typeof objectOrArrayOrString === 'object' && !Array.isArray(objectOrArrayOrString)) {
                        let keys = Object.keys(objectOrArrayOrString);
                        let numbChunks = Math.ceil(keys.length / 255);
                        let current = {};
                        return keys.reduce((acc, key, i) => {
                            if ((i + 1) % numbChunks === 0) {
                                acc.push(current);
                                current = {};
                            }
                            current[key] = objectOrArrayOrString[key];
                            return acc;
                        }, []);
                    }

                    if (typeof objectOrArrayOrString === 'string' || Array.isArray(objectOrArrayOrString)) {
                        let chunks = [];
                        let numbChunks = Math.ceil(objectOrArrayOrString.length / 255);

                        for (let i = 0; i < numbChunks * 255; i += 255) {
                            chunks.push(objectOrArrayOrString.slice(i, i + 255));
                        }

                        return chunks;
                    }
                    return [objectOrArrayOrString];
                };

                function shortTrace() {
                    let trace = traceRoute();
                    let shortRegex = /^(.*)\((?:\/*[\w|\-|\.]+\/)*(\w+.*\:[0-9]*\:[0-9]*)\)/;
                    return (trace.match(shortRegex) || []).slice(1).join(' | ');
                }

                this.devFormat = hooks.devFormat || function (level, args, pretty) {
                    let ts = new Date().toISOString().substr(0, 19);
                    let string = `${ts} ${loggerName} ${level} ${shortTrace()}`;

                    for (let x = 0; x < args.length; ++x) {
                        string += ' ' + (typeof args[x] === 'object' ? self.stringify(args[x], pretty) : args[x]);
                    }

                    return [string];
                };


                this.prodFormat = hooks.prodFormat || function (level, args, pretty) {
                    let data = {
                        timestamp: new Date().toISOString().replace('Z', '+00:00'),
                        logger_name: loggerName,
                        level: level,
                        log_line: traceRoute()
                    };
                    let messages = [];
                    for (let i = 0; i < args.length; ++i) {
                        /* jshint ignore:start */
                        slicer(args[i]).forEach((slice) => {
                            data[messageKey] = slice;
                            messages.push(self.stringify(data, pretty));
                        });
                        /* jshint ignore:end */
                    }

                    return messages;
                };

                let minLevel = levels.indexOf(this.level = hooks.level || 'info');


                this.format = function (level, parentArgs, pretty) {
                    if (levels.indexOf(level) >= minLevel) {

                        // Audit
                        if(typeof hooks.audit === 'function') {
                            hooks.audit('logs', this.prodFormat(level, parentArgs, pretty));//always audit as an object
                        }

                        if (process.env.NODE_ENV === 'prod') {
                            return this.prodFormat(level, parentArgs, pretty);
                        }
                        else {
                            return this.devFormat(level, parentArgs, pretty);
                        }
                    }
                    return [];
                };

            }


            stringify(obj, pretty) {
                if (typeof obj === 'string') {
                    return obj;
                }
                return JSON.stringify(obj, (key, value) => {
                    if (typeof value === 'function') {
                        return '[FUNCTION]';
                    }
                    return value;
                }, (pretty || this.prettyFormat) ? 3 : 0);
            }

            silly() {
                this.format('silly', arguments).forEach((message) => {
                    this.outStream.write(`${message}\n`);
                });
            }

            info() {
                this.format('info', arguments).forEach((message) => {
                    this.outStream.write(`${message}\n`);
                });
            }

            log() {
                this.format('info', arguments).forEach((message) => {
                    this.outStream.write(`${message}\n`);
                });
            }

            box() {
                this.format('info', arguments).forEach((message) => {
                    const topBottomPad = `|${new Array(message.length + 2).fill('-').join('')}|`;
                    const middlePad = `|${new Array(message.length + 2).fill(' ').join('')}|`;

                    this.errStream.write(`${topBottomPad}\n`);
                    this.errStream.write(`${middlePad}\n`);
                    this.errStream.write(`| ${message} |\n`);
                    this.errStream.write(`${middlePad}\n`);
                    this.errStream.write(`${topBottomPad}\n`);
                });
            }

            error() {
                this.format('error', arguments).forEach((message) => {
                    this.outStream.write(`${message}\n`);
                });
            }

            warn() {
                this.format('warn', arguments).forEach((message) => {
                    this.outStream.write(`${message}\n`);
                });
            }

            verbose() {
                this.format('verbose', arguments).forEach((message) => {
                    this.outStream.write(`${message}\n`);
                });
            }

            debug() {
                this.format('debug', arguments).forEach((message) => {
                    this.outStream.write(`${message}\n`);
                });
            }

            critical() {
                this.format('critical', arguments).forEach((message) => {
                    this.errStream.write(`${message}\n`);
                });
            }


            crucial() {
                this.format('crucial', arguments).forEach((message) => {
                    this.errStream.write(`${message}\n`);
                    process.exit(1);
                });
            }

            pretty() {
                this.format('info', arguments, true).forEach((message) => {
                    this.outStream.write(`${message}\n`);
                });
            }

            setPretty(input) {
                this.prettyFormat = input;
            }

        }

    }
}

module.exports = LoggerFactory;