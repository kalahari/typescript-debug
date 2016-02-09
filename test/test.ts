import * as proxyquire from "proxyquire";
import * as util from "util";
import "mocha";
import {assert} from "chai";

let debugCheck: any[][] = null;
let debugName: string = null;
let debugMethod = function(...args: any[]) {
    debugCheck.push(args);
};
let debugModule = function(prefix: string) {
    debugName = prefix;
    return debugMethod;
};
let tsDebug = proxyquire("../lib/index", { "debug": debugModule });

@tsDebug.TraceClass({ tracePrefix: "test" })
class Test {
    constructor(a = true, b = "b") { }
    // static FOO = "FOO";
    // static BAR() {
    //     return "BAR";
    // }
    foo() {
        // try {
        //     throw new Error("foo");
        // } catch (e) {
        //     console.log(e.stack);
        // }
        return "foo";
    }
    bar(bas: string = "bas") {
        return bas + "|" + this.foo(); // + "|" + Test.FOO + "|" + + Test.BAR() + "|" + (<any>this.constructor).name;
    }
}

beforeEach(() => {
    debugCheck = [];
});
describe("typscript-debug TraceClass", () => {
    it("debug name should be tracePrefix and class name", () => {
        assert(debugName === "test:Test", "debugName is: " + util.inspect(debugName));
    });
    it("parameterless construction should trace 'new()'", () => {
        let test = new Test();
        let args = debugCheck.shift();
        assert(args[0] === "%s()" &&
            args[1] === "new",
            "args is: " + util.inspect(args));
    });
    it("parameterized construction should trace 'new(p1, p2, ...)'", () => {
        let test = new Test(false, "bee");
        let args = debugCheck.shift();
        assert(args[0] === "%s(%s, %s)" &&
            args[1] === "new" &&
            args[2] === false &&
            args[3] === "bee",
            "args is: " + util.inspect(args));
    });
    it("parameterless method should trace 'methodName()'", () => {
        let test = new Test();
        test.foo();
        // discard construction
        debugCheck.shift();
        let args = debugCheck.shift();
        assert(args[0] === "%s()" &&
            args[1] === "foo",
            "args is: " + util.inspect(args));
    });
    it("parameterized method should trace 'methodName(p1, p2, ...)'", () => {
        let test = new Test();
        test.bar("foo");
        // discard construction
        debugCheck.shift();
        let args = debugCheck.shift();
        assert(args[0] === "%s(%s)" &&
            args[1] === "bar" &&
            args[2] === "foo",
            "args is: " + util.inspect(args));
    });
    it("method return should trace 'methodName: ret'", () => {
        let test = new Test();
        test.foo();
        // discard construction
        debugCheck.shift();
        // discard invocation
        debugCheck.shift();
        let args = debugCheck.shift();
        assert(args[0] === "%s: %s" &&
            args[1] === "foo" &&
            args[2] === "foo",
            "args is: " + util.inspect(args));
    });
    it("nested method should trace in depth first order", () => {
        let test = new Test();
        test.bar();
        // discard construction
        debugCheck.shift();
        let args = debugCheck.shift();
        assert(args[0] === "%s()" &&
            args[1] === "bar",
            "args is: " + util.inspect(args));
        args = debugCheck.shift();
        assert(args[0] === "%s()" &&
            args[1] === "foo",
            "args is: " + util.inspect(args));
        args = debugCheck.shift();
        assert(args[0] === "%s: %s" &&
            args[1] === "foo" &&
            args[2] === "foo",
            "args is: " + util.inspect(args));
        args = debugCheck.shift();
        assert(args[0] === "%s: %s" &&
            args[1] === "bar" &&
            args[2] === "bas|foo",
            "args is: " + util.inspect(args));
    });
});