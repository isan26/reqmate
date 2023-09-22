import { useState } from 'react'
import reqmate, { Timed } from 'reqmate';

const TimedComponent = () => {
    const [state, setState] = useState<undefined | Object>()


    function doExponentialBackoff() {
        reqmate
            .get('https://jsonplaceholder.typicode.com/todos/3')
            .setRetry({
                type: 'timed',
                interval: 1000,
                maxRetries: 30, // 30 retries
                timeout: 10000, // 10 seconds
                intervalCallback: Timed.doExponentialBackoff(2, 100000),
                onResponse: (r) => console.log('RESPONSE: ', r),
                onError: (e) => console.log('ERROR: ', e)
            })
            .send()
            .then((res) => console.log('RES: ', res));

    }

    function doLinearBackoff() {
        reqmate
            .get('https://jsonplaceholder.typicode.com/todos/3')
            .setRetry({
                type: 'timed',
                maxRetries: 30, // 30 retries
                timeout: 10000, // 10 seconds
                intervalCallback: Timed.doLinearBackoff(200, 1000),
                onResponse: (r) => console.log('RESPONSE: ', r),
                onError: (e) => console.log('ERROR: ', e)
            })
            .send()
            .then((res) => console.log('RES: ', res));
    }


    function doStaticBackoff() {
        reqmate
            .get('https://jsonplaceholder.typicode.com/todos/3')
            .setRetry({
                type: 'timed',
                interval: 1000,
                maxRetries: 30, // 30 retries
                timeout: 10000, // 10 seconds
                intervalCallback: Timed.doStaticBackoff(),
                onResponse: (r) => console.log('RESPONSE: ', r),
                onError: (e) => console.log('ERROR: ', e)
            })
            .send()
            .then((res) => console.log('RES: ', res));
    }

    function doRandomBackoff() {
        reqmate
            .get('https://jsonplaceholder.typicode.com/todos/3')
            .setRetry({
                type: 'timed',
                maxRetries: 30, // 30 retries
                timeout: 10000, // 10 seconds
                intervalCallback: Timed.doRandomBackoff(1000, 5000),
                onResponse: (r) => console.log('RESPONSE: ', r),
                onError: (e) => console.log('ERROR: ', e)
            })
            .send()
            .then((res) => console.log('RES: ', res));
    }


    function doCustomBackoff() {
        function customRetry() {
            let isFlagTrue = true;
            return () => {
                isFlagTrue = !isFlagTrue;
                console.log('isFlagTrue: ', isFlagTrue);
                return isFlagTrue ? 1000 : 3000;
            }
        }

        reqmate
            .get('https://jsonplaceholder.typicode.com/todos/3')
            .setRetry({
                type: 'timed',
                maxRetries: 30, // 30 retries
                timeout: 10000, // 10 seconds
                intervalCallback: customRetry(),
                onResponse: (r) => console.log('RESPONSE: ', r),
                onError: (e) => console.log('ERROR: ', e)
            })
            .send()
            .then((res) => console.log('RES: ', res));
    }



    return (
        <div>
            <h1>Timed</h1>
            <p>Timed backoff strategies are used to retry requests after a certain amount of time has passed.</p>
            <pre>
                <code>
                    {state && JSON.stringify(state, null, 10)}
                </code>
            </pre>

            <button onClick={doExponentialBackoff}>Exponential Backoff</button>
            <button onClick={doLinearBackoff}>Linear Backoff</button>
            <button onClick={doStaticBackoff}>Static Backoff</button>
            <button onClick={doRandomBackoff}>Random Backoff</button>
            <button onClick={doCustomBackoff}>Custom Backoff</button>

        </div>
    )
}

export default TimedComponent
