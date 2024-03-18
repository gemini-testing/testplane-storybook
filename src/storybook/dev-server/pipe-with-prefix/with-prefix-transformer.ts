import { Transform, TransformCallback } from "stream";

export class WithPrefixTransformer extends Transform {
    prefix: string;
    includePrefix: boolean;

    constructor(prefix: string) {
        super();

        this.prefix = `\x1B[32m${prefix}\x1B[39m`; // Green
        this.includePrefix = true;
    }

    _transform(chunk: string, _: string, callback: TransformCallback): void {
        const chunkString = chunk.toString();
        const chunkRows = chunkString.split("\n");

        const includeSuffix = chunkString.endsWith("\n") && chunkRows.pop() === "";

        const resultPrefix = this.includePrefix ? this.prefix : "";
        const resultSuffix = includeSuffix ? "\n" : "";
        const resultData = resultPrefix + chunkRows.join("\n" + this.prefix) + resultSuffix;

        this.push(resultData);
        this.includePrefix = includeSuffix;

        callback();
    }
}
