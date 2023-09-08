import Retry from "./base/Retry";

export default class Polling extends Retry {

    public async execute(): Promise<unknown> {
        let result: unknown;

        while ((this._maxRetries == -1 || this._retries < this._maxRetries)) {
            try {
                result = await this.callback();
                this._onResponse(result, this.done.bind(this));
            } catch (error) {
                this._onFailure(error, this.done.bind(this));
                result = error;
            }
            this._retries++;

            if (this._done) {
                return result;
            }
        }

        return result;
    }

}
