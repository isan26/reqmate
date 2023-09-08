const reqmate = require('../dist/src/').default
const MapCache = require('../dist/src/MapCache').default;

const Retry = require('../dist/src/retry/Retry');
const Polling = require('../dist/src/retry/LongPolling').default;
const Timed = require('../dist/src/retry/Timed').default;


const url = "https://jsonplaceholder.typicode.com/todos/1";


// reqmate
//     .get('https://jsonplaceholder.typicode.com/todos/1')
//     // .setParser(async res => {
//     //     const d = await res.json();
//     //     return d.title;
//     // })
//     .send()
//     .then(console.log);

// reqmate.get("https://httpbin.org/delay/5").setTimeout(5).send().then(console.log)


// function simpleHash(str) {
//     let hash = 0;
//     for (let i = 0; i < str.length; i++) {
//         const char = str.charCodeAt(i);
//         hash = ((hash << 5) - hash) + char;
//         hash = hash & hash; // Convert to 32bit integer
//     }
//     return Math.abs(hash).toString();
// }

// function objectHash(obj) {
//     const str = JSON.stringify(obj, Object.keys(obj).sort());
//     return simpleHash(str);
// }

// // Example usage:

// const myObj1 = { name: 'Alice', age: 25, address: { city: 'Wonderland' }, hello: false };
// const myObj2 = { name: 'Alice', age: 25, address: { city: 'Wonderland' } };
// const myObj3 = { name: 'Bob', age: 25, address: { city: 'Wonderland' } };

// console.log(objectHash(myObj1));  // Output should be the same for myObj1 and myObj2
// console.log(objectHash(myObj2));
// console.log(objectHash(myObj3));


// const cache = new MapCache();

// cache.set('hello', "world", 100);
// cache.set('you', "there")

// console.log(cache.size)
// console.log(cache.keys)
// console.log(cache.values)
// cache.forEach(console.log)

// setTimeout(() => console.log(cache.values), 200)


// console.log(MapCache.generateKey(process))

// async function test() {
//     let counter = 0;
//     const url = "https://jsonplaceholder.typicode.com/todos/1"
//     const first = await reqmate
//         .get(url)
//         .setCaching(5)
//         .send()

//     setInterval(async () => {
//         // console.log("REQUESTING: ", counter);

//         const r = await reqmate
//             .get(url)
//             .setCaching(3)
//             .send()

//         console.log(`RESPONSE FOR: ${counter} from cache ${r.cached} ${r.cacheKey}`)

//         counter++;
//         // console.log(reqmate.cache.keys)
//     }, 1000)
// }

// PENDING RETRY MECHANISMS
// test();


// (async function longPollingTest() {

//     console.log("EXECUTING POLLING")
//     let c = 0;
//     const t = async () => new Promise((resolve, reject) => {
//         setTimeout(() => {
//             c++;
//             if (c == 2) reject("Rejecting")
//             resolve(Date.now())
//         }, 1000)
//     });

//     let cc = 0;
//     const result = await (new LongPolling(t))
//         .onResponse((r, done) => {
//             cc++;

//             cc >= 3 && done();
//             console.log("ON RESPONSE: ", r)
//         })
//         .onError(r => console.error("REJECTING", typeof r))
//         .setMaxRetries(10)
//         .setTimeout(5)
//         .execute();


//     console.log({ result })
// })()



// (async function shortPollingTest() {

//     console.log("EXECUTING POLLING")
//     let c = 0;
//     const t = async () => new Promise((resolve, reject) => {
//         setTimeout(() => {
//             c++;
//             if (c == 2) reject("Rejecting")
//             resolve(Date.now())
//         }, 1000)
//     });

//     console.log("HELLO")

//     const result = await (new ShortPolling(t))
//         .onResponse(e => console.info(e))
//         .setInterval(3)
//         .setTimeout(5)
//         .setMaxRetries(10)
//         .execute();

//     console.log("WORLD")

//     console.log({ result })


// })()


// (async function test() {
//     const url = "https://jsonplaceholder.typicode.com/todos/1"

//     const pollingLong = (new LongPolling())
//         .setMaxRetries(10)
//         .onResponse((r, done) => {
//             done();
//         });

//     const shortPolling = (new ShortPolling())
//         .onResponse((r, d) => {
//             console.log("CALL")
//             // d();
//         })
//         .setInterval(1)
//         .setMaxRetries(20)
//         .setTimeout(5)

//     const result = await reqmate
//         .get(url)
//         .setRetry(polling)
//         // .setRetry(shortPolling)
//         .setCaching(5)
//         .send()

//     console.log({ result })
// })()


(async function exponentialTest() {

    const exp = (new Timed())
        // .setInterval(200)
        // .setMaxRetries(5)
        // .setIntervalCallback(Timed.doStaticBackoff())
        // .setIntervalCallback(Timed.doLinearBackoff(200))
        // .setIntervalCallback(Timed.doExponentialBackoff())
        // .setIntervalCallback(Timed.doNoBackoff())
        .setIntervalCallback(Timed.doRandomBackoff(200, 1000))
        // .setTimeout(1000)
        .onResponse(r => console.log("ON RESPONSE: ", r.status));


    const result = await reqmate
        .get(url)
        .setCaching()
        .setRetry({
            type: "polling",
            maxRetries: 2,
            onResponse: (e) => console.log(e.status)
        })
        .send();

    const cached = await reqmate
        .get(url)
        .setRetry(exp)
        .send();

    console.log({ result: result.cached, cached: cached.cached })
})()
// Timed, Polling, TimedExponential, TimedLinear etc..
// Timed can have the expiration algorithm injected, by default will be the regular polling

// (async function exponentialTest() {
//     const exp = (new Linear())
//         .setInterval(500)
//         .setMaxRetries(10)
//         // .setTimeout(5)
//         .onResponse(r => console.log("ON RESPONSE: ", r.status));


//     const result = await reqmate
//         .get(url)
//         .setCaching()
//         .setRetry(exp)
//         .send();

//     const cached = await reqmate
//         .get(url)
//         .setRetry(exp)
//         .send();
//     console.log({ result, cached })
// })()
