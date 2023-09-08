import Retry from "./base/Retry";
import Timed from "./Timed";
import Polling from "./Polling";

export default class RetryFactory {

    static build(retry: Retry | TimedConfig | PollingConfig) {
        if (retry instanceof Retry) {
            return retry;
        }

        return RetryFactory.buildFromObject(retry);
    }

    private static buildFromObject(config: TimedConfig | PollingConfig) {
        switch (config.type) {
            case 'timed':
                return RetryFactory.buildTimed(config);
            case 'polling':
                return RetryFactory.buildPolling(config);
            default:
                throw new Error('Invalid retry type');
        }
    }

    private static buildTimed(config: TimedConfig) {
        const timed = new Timed();
        config.interval && timed.setInterval(config.interval);
        config.maxRetries && timed.setMaxRetries(config.maxRetries);
        config.onResponse && timed.onResponse(config.onResponse);
        config.onError && timed.onResponse(config.onError);
        config.intervalCallback && timed.setIntervalCallback(config.intervalCallback);
        config.timeout && timed.setTimeout(config.timeout);

        return timed
    }

    private static buildPolling(config: PollingConfig) {
        const polling = new Polling();
        config.maxRetries && polling.setMaxRetries(config.maxRetries);
        config.onResponse && polling.onResponse(config.onResponse);
        config.onError && polling.onResponse(config.onError);
        config.timeout && polling.setTimeout(config.timeout);

        return polling
    }
}

type TimedConfig = {
    type: 'timed',
    interval: number,
    maxRetries: number,
    callback: Function,
    onResponse: (response: unknown, done: () => void) => void,
    onError: (response: unknown, done: () => void) => void,
    intervalCallback: (interval: number) => number,
    timeout: number
}

type PollingConfig = {
    type: 'polling',
    interval: number,
    maxRetries: number,
    callback: Function,
    onResponse: (response: unknown, done: () => void) => void,
    onError: (response: unknown, done: () => void) => void,
    intervalCallback: (interval: number) => number,
    timeout: number
}


export type RetryTypes = TimedConfig | PollingConfig | Retry;
