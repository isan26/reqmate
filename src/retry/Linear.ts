
import ShortPolling from "./ShortPolling";

export default class Linear extends ShortPolling {
    private _intervalIncreaseBy: number = 1;


    public setIntervalIncrease(increase: number) {
        this._intervalIncreaseBy = increase;
        return this;
    }

    get interval() {
        return this._interval += this._intervalIncreaseBy;
    }

}
