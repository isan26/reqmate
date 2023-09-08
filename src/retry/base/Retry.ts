export default class Retry {
    public _maxRetries = -1;
    public _retries: number = 0;
    public _done = false;
    public _onResponse = (response: unknown, done: () => void) => { };
    public _onFailure = (error: unknown, done: () => void) => { };
    public callback: (() => Promise<unknown>) = async () => {
        console.log('callback not set');
    };

    public setCallback(callback: () => Promise<unknown>): Retry {
        this.callback = callback;
        return this;
    }

    public onResponse(callback: (response: unknown, done: () => void) => void): Retry {
        this._onResponse = callback;
        return this;
    }

    public onError(callback: (error: unknown, done: () => void) => void): Retry {
        this._onFailure = callback;
        return this;
    }

    public setMaxRetries(maxRetry: number): Retry {
        this._maxRetries = maxRetry;
        return this;
    }

    public setTimeout(timeout: number): Retry {
        setTimeout(() => {
            this._done = true;
        }, timeout);
        return this;
    }

    public async execute(): Promise<unknown> {
        return async () => { }
    }


    public done(): void {
        this._done = true;
    }

}
