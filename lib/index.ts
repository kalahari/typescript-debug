"use strict";

import * as Debug from "debug";

export interface ITraceConfig {
    tracePrefix?: string;
    classFilter?: RegExp;
    methodFilter?: RegExp;
    traceNew?: boolean;
}

class TraceConfig implements ITraceConfig {
    tracePrefix = "";
    classFilter = /.*/;
    methodFilter = /.*/;
    traceNew = true;
    constructor(cfg: ITraceConfig = null) {
        if (!cfg) return;
        if (cfg.tracePrefix != null) this.tracePrefix = cfg.tracePrefix;
        if (this.tracePrefix.length > 0 && !/:$/.test(this.tracePrefix)) {
            this.tracePrefix += ":";
        }
        if (cfg.classFilter) this.classFilter = cfg.classFilter;
        if (cfg.methodFilter) this.methodFilter = cfg.methodFilter;
        if (cfg.traceNew != null) this.traceNew = cfg.traceNew;
    }
}

export function TraceClass(config: ITraceConfig = null) {
    let cfg = new TraceConfig(config);
    return function(target: any) {
        let className = "" + target.name;
        if (!cfg.classFilter.test(className)) {
            return target;
        }
        let debug = Debug(cfg.tracePrefix + className);
        let debugCall = (name: string, args: any[]) => {
            let format = "%s(" + args.map(val => "%s").join(", ") + ")";
            debug(format, name, ...args);
        };
        Object.keys(target.prototype).forEach(function(methodName: string) {
            let original = target.prototype[methodName];
            if (typeof original !== "function" || !cfg.methodFilter.test(methodName)) return;
            let traceMethod = function(...args: any[]) {
                debugCall(methodName, args);
                let ret = original.apply(this, args);
                debug("%s: %s", methodName, ret);
                return ret;
            };
            target.prototype[methodName] = traceMethod;
        });
        if (!cfg.traceNew) {
            // no need to redefined the constructor, we already monkey-patched the prototype
            return target;
        }
        let ctr: any = null;
        if (className.length > 0) {
            // unfortunately eval is necessary to preserve the type name
            // but it plays havoc with the stack
            ctr = eval(`
                (function() {
                    function ` + className + `() {
                        var args = [].slice.call(arguments);
                        debugCall("new", args);
                        return target.apply(this, args);
                    }
                    return ` + className + `;
                }());
            `);
        } else {
            ctr = function(...args: any[]) {
                debugCall("new", args);
                return target.apply(this, args);
            };
        }
        // bring over the static members
        Object.keys(target).forEach(name => ctr[name] = target[name]);
        // copy prototype so intanceof operator still works
        ctr.prototype = target.prototype;
        return ctr;
    };
}

