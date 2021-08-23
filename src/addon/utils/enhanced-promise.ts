import { noop } from "lodash";

export default class EnhancedPromise<T> {
    private promise: Promise<T>;
    private resolveCb: (value: T) => void = noop;
    private rejectCb: (reason?: unknown) => void = noop;

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolveCb = resolve;
            this.rejectCb = reject;
        });
    }

    public resolve(value: T): void {
        this.resolveCb(value);
    }

    public reject(reason?: unknown): void {
        this.rejectCb(reason);
    }

    public done(): Promise<T> {
        return this.promise;
    }
}
