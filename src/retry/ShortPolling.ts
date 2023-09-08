import Retry from "./Retry";

export default class ShortPolling extends Retry {

    private _interval: number = 0;
    private _result: unknown;
    private _timer: NodeJS.Timeout | null = null;
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
            }

            if (this._done || (this._maxRetries > -1 && this._retries >= this._maxRetries)) {
                clearTimeout(this._timer);
                this.resolve();
            }
        });

    }

    public setInterval(interval: number): ShortPolling {
        this._interval = interval * 1000;
        return this;
    }

    public setTimeout(timeout: number): Retry {
        setTimeout(() => {
            this._done = true;
            this._timer && clearTimeout(this._timer);
            this.resolve();
        }, timeout * 1000);
        return this;
    }


    private resolve(): void {
        this._resolve && this._resolve(this._result);
    }
}
