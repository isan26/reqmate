import Exponential from '../src/retry/Exponential';

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe('Testing Exponential Retry', () => {

    beforeEach(() => {
        jest.spyOn(global, 'setTimeout');
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.runAllTimers();
        jest.clearAllMocks();
        jest.restoreAllMocks();
        jest.useRealTimers();
    })



    it('should return 1', async () => {
        // Run all timers to make sure the setTimeout in testPromise is executed
        const callback = jest.fn();
        const result = (new Exponential())
            .setInterval(2)
            .setCallback(testPromise)
            .setMaxRetries(3)
            .execute();
        // const result = testPromise();
        jest.runAllTimers();

        // Await the result after running the timers
        expect(setTimeout).toHaveBeenCalledTimes(3);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 6);
        expect(await result).toBe(1);
    });
})


function testPromise() {
    let counter = 0;
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            counter++;
            resolve(counter);
        }, 1);
    });
}
