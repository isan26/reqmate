import Retry from "./base/Retry";

export default class Timed extends Retry {
    public _interval: number = 0;
    private _result: unknown;
    private _timer: any | null = null;
    private _resolve: ((value: unknown) => void) | null = null;
    private _intervalCallback: ((interval: number) => number) = Timed.doStaticBackoff();

    public async execute(): Promise<unknown> {
        return new Promise(async (resolve) => {
            !this._resolve && (this._resolve = resolve);
            try {
                this._result = await this.callback!();
                this._onResponse(this._result, this.done.bind(this));
            } catch (error) {
                this._result = error;
                this._onFailure(error, this.done.bind(this));
            } finally {
                this._retries++;
                this._timer = setTimeout(this.execute.bind(this), this._interval);
                this._interval = this._intervalCallback!(this._interval);
            }

            if (this._done || (this._maxRetries > -1 && this._retries >= this._maxRetries)) {
                clearTimeout(this._timer);
                this.resolve();
            }
        });
    }

    public setIntervalCallback(callback: typeof this._intervalCallback) {
        this._intervalCallback = callback;
        return this;
    }

    public setTimeout(timeout: number) {
        setTimeout(() => {
            this._done = true;
            this._timer && clearTimeout(this._timer);
            this.resolve();
        }, timeout);
        return this;
    }


    public resolve(): void {
        this._resolve && this._resolve(this._result);
    }

    public setInterval(interval: number) {
        this._interval = interval;
        return this;
    }

    static doExponentialBackoff(factor: number = 2, maxInterval: number = Number.MAX_SAFE_INTEGER) {
        return (interval: number) => {
            return Math.min(interval * factor, maxInterval);
        }
    }


    static doLinearBackoff(factor: number = 200, maxInterval: number = Number.MAX_SAFE_INTEGER) {
        return (interval: number) => {
            return Math.min(interval + factor, maxInterval);
        }
    }

    static doStaticBackoff() {
        return (interval: number) => interval;
    }


    static doRandomBackoff(minIterval: number, maxInterval: number) {
        return () => {

            if (minIterval >= maxInterval) {
                throw new Error('timeout cannot be greater than maxInterval');
            };

            return Math.floor(Math.random() * (maxInterval - minIterval) + minIterval);
        }
    }

    static doNoBackoff() {
        return () => 0;
    }


}
