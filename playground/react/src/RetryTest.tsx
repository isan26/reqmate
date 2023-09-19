import React from 'react'

import reqmate from '../../../src';
import Polling from '../../../src/retry/Polling';
import Timed from '../../../src/retry/Timed';



const RetryTest = () => {
    async function doPolling() {
        const polling = new Polling();

        polling.onResponse((r) => console.log('RESPONSE: ', r))
            .onError((e) => console.log('ERROR: ', e))
            .setMaxRetries(3);

        const { data } = await reqmate
            .get("https://jsonplaceholder.typicode.com/todos/1")
            .setRetry(polling)
            .send<Record<string, string>>();

        console.log({ data })
    }

    async function doTimed() {

        const timed = new Timed();

        timed.onResponse((r) => console.log('RESPONSE: ', r))
            .onError((e) => console.log('ERROR: ', e))
            .setMaxRetries(3)
            .setInterval(1000)
            .setTimeout(10000)
            .setIntervalCallback(Timed.doExponentialBackoff());


        const { data } = await reqmate
            .get("https://jsonplaceholder.typicode.com/todos/1")
            .setRetry(timed)
            .send<Record<string, string>>();

        console.log({ data })
    }

    return (
        <div>
            <button onClick={doPolling}>Polling</button>
            <button onClick={doTimed}>Timed</button>
        </div>
    )
}

export default RetryTest
