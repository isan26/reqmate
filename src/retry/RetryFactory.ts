import Retry from "./base/Retry";
import Timed from "./Timed";
import Polling from "./Polling";
import { ReqMateResponse } from "../Req";

export default class RetryFactory {

    static build<OnResponse = unknown>(retry: Retry | TimedConfig<OnResponse> | PollingConfig<OnResponse>) {
        if (retry instanceof Retry) {
            return retry;
        }

        return RetryFactory.buildFromObject<OnResponse>(retry);
    }

    private static buildFromObject<OnResponse = unknown>(config: TimedConfig<OnResponse> | PollingConfig<OnResponse>) {
        switch (config.type) {
            case 'timed': return RetryFactory.buildTimed<OnResponse>(config);
            case 'polling': return RetryFactory.buildPolling<OnResponse>(config);
            default:
                throw new Error('Invalid retry type');
        }
    }

    private static buildTimed<OnResponse = unknown>(config: TimedConfig<OnResponse>) {
        const timed = new Timed();
        config.interval && timed.setInterval(config.interval);
        config.maxRetries && timed.setMaxRetries(config.maxRetries);
        config.onResponse && timed.onResponse<OnResponse>(config.onResponse);
        config.onError && timed.onError(config.onError);
        config.intervalCallback && timed.setIntervalCallback(config.intervalCallback);
        config.timeout && timed.setTimeout(config.timeout);

        return timed
    }

    private static buildPolling<OnResponse = unknown>(config: PollingConfig<OnResponse>) {
        const polling = new Polling();
        config.maxRetries && polling.setMaxRetries(config.maxRetries);
        config.onResponse && polling.onResponse<OnResponse>(config.onResponse);
        config.onError && polling.onError(config.onError);
        config.timeout && polling.setTimeout(config.timeout);

        return polling
    }
}

type TimedConfig<OnResponse = unknown> = {
    type: 'timed',
    intervalCallback?: (interval: number) => number,
} & CommonPollingConfig<OnResponse>

type PollingConfig<OnResponse = unknown> = { type: 'polling' } & CommonPollingConfig<OnResponse>


type CommonPollingConfig<OnResponse = unknown, OnError = unknown> = {
    interval?: number,
    maxRetries?: number,
    callback?: Function,
    onResponse?: (response: ReqMateResponse<OnResponse>, done: () => void) => void,
    onError?: (response: unknown, done: () => void) => void,
    timeout?: number
}

export type RetryTypes<OnResponse = unknown> = TimedConfig<OnResponse> | PollingConfig<OnResponse> | Retry;
