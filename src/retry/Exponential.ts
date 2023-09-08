// Exponential Backoff
// In exponential backoff, the time interval between retry attempts is doubled after each failure, up to a maximum interval or a maximum number of attempts.This approach helps to alleviate the load on the server and is often used in conjunction with a random "jitter" to avoid synchronizing retries from multiple clients.

import Retry from "./Retry";

export default class Exponential extends Retry {
    private _interval: number = 0;
    private _result: unknown;
    private _timer: any | null = null;
    private _resolve: ((value: unknown) => void) | null = null;

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
                this._interval *= 2;
            }

            if (this._done || (this._maxRetries > -1 && this._retries >= this._maxRetries)) {
                clearTimeout(this._timer);
                this.resolve();
            }
        });
    }

    private resolve(): void {
        this._resolve && this._resolve(this._result);
    }

    public setInterval(interval: number) {
        this._interval = interval * 1000;
        return this;
    }

};
