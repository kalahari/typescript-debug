# typescript-debug
TypeScript decorator to conditionally trace method calls via https://github.com/visionmedia/debug

[![Build Status](https://travis-ci.org/kalahari/typescript-debug.svg?branch=master)](https://travis-ci.org/kalahari/typescript-debug)

## usage
Below is a simple usage scenario for the `TraceClass` decorator. The configuration options are not yet documented
but you can find them in `lib/index.ts`.

### Given the input file `trace-example.ts`:
```ts
import {TraceClass} from "typescript-debug";

@TraceClass({ tracePrefix: "example" })
class TraceExample {
	constructor(public abc: string) { }
	public getAbc() {
		return this.abc;
	}
	public combineWithAbc(xyz: string) {
		return this.getAbc() + " and " + xyz;
	}
}

let te = new TraceExample("ABC");
te.combineWithAbc("XYZ");
```

### Trace output would look like this:
```
blake@ignignokt:~/example$ tsc --module commonjs --target es5 --experimentalDecorators trace-example.ts
blake@ignignokt:~/example$ DEBUG=\* node trace-example.js
  example:TraceExample new(ABC) +0ms
  example:TraceExample combineWithAbc(XYZ) +4ms
  example:TraceExample getAbc() +3ms
  example:TraceExample getAbc: ABC +0ms
  example:TraceExample combineWithAbc: ABC and XYZ +0ms
```
> Note that the output is normally colorized in your console by `debug`.
