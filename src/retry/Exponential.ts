import ShortPolling from "./ShortPolling";

export default class Exponential extends ShortPolling {
    get interval() {
        return this._interval * 2;
    }
};
