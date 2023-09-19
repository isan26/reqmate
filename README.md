# reqmate

Uncomplicated and extensible HTTP client lib on top of fetch with caching and retry mechanisms. It works on browser, nodejs, Bun, etc..

## Table of Contents

- [Basic Usage](#basic-usage)
- [Request Configuration](#request-configuration)
- [Response](#response)
- [Parser](#parser)
- [Caching](#caching)
- [Retry](#retry)
  - [onResponse and onError](#onresponse-and-onerror)
  - [Polling](#polling)
  - [Timed](#timed)
    - [Exponential](#exponential)
    - [Linear](#linear)
    - [Static](#static)
    - [Random](#randomg)
    - [Custom](#custom)
- [Advanced](#advanced)
  - [Cache](#implementing-own-cache)
  - [Retry](#advanced-retry)

## Basic Usage

ReqMate is a wrapper on top of fetch in order to make it simpler to use and also add some common use capabilities, it uses the [builder pattern](https://refactoring.guru/design-patterns/builder) to create and send a request, the simplest way is to call reqmate, specify the HTTP verb and call send, check the following code snippet

```javascript
// Import the lib
import reqmate from 'reqmate';


// GET
const getRequest = await reqmate.get("/product?id=666").send();

// POST
const postBody = {name : "The Necronomicon", type : "book", price : 11}
const postRequest = await reqmate.post("/product", postBody).send();

// PUT
const putBody = {id : 666, name : "The Necronomicon", type : "book", price : 11};
const putRequest = await reqmate.put("/product", putBody).send();

// PATCH
const patchBody = {id : 666, price : 666};
const patchRequest = await reqmate.patch("/product", patchBody).send();

// DELETE
const deleteRequest = await reqmate.delete("/product/666").send();

```

## Request Configuration

The fields `mode`, `credentials`, `cache` and `redirect` can be especified by setting the request's config.

The following code snippet

```javascript
const getRequest = await reqmate
            .get("/product?id=666")
            .setConfig({
                mode : "cors",
                credentials : "include",
                cache : "no-cache",
                redirect : "follow"
            })
            .send();

```

## Response

The response object contains:

- **ok**: Boolean value, true if request is a success (is the standard fetch ok field)
- **status** : Number value, status code of the request
- **headers** : Object with the headers.
- **cached** : Boolean value, will be true if the request was cached
- **cacheKey** (optional) : String, string value with the cache key.
- **data** : Result from parsing the response from the server

```JSON
{
   "ok":true,
   "status":200,
   "headers":{
      "cache-control":"max-age=43200",
      "content-type":"application/json; charset=utf-8",
      "expires":"-1",
      "pragma":"no-cache"
   },
   "cached":false,
   "data":{
      "userId": 1,
      "id": 1,
      "title": "delectus aut autem",
      "completed": false
   }
}
```

## Parser

The parser is a promise that will process the "raw" request accordingly.

ReqMate comes with default parsers that are gonna get called depending on the Content-Type header value. So usually we won't have the need to override it, but if needed, the parser can be replaced by setting it using the setParser step of the builder.

The following code snippet shows how to use a custom parser Note that the parser can be a promise, in fact the default parsers are promises.

```typescript
    const isPostSuccess : Boolean = await reqmate
        .post(URL, { payload: "hello" })
        .setParser(response => response.status === 201)
        .send();
  // isPostSuccess will be a boolean, if the response status is 201 will be set to true


// Another example, will process the response and return the processed value on the data field. (You can try this one on you own code)
    const { data } = await reqmate
      .get("https://jsonplaceholder.typicode.com/todos/1")
      .setParser(async (response: Response) => {
        const { title, completed } = await response.json();
        return `${title} is ${completed ? "Completed" : "Not Completed"}`;
      })
      .send<string>();

      // data will be the string "delectus aut autem is Not Completed" instead of the full object returned by the server


// Taking it further, on the following react example, we are gonna return a component directly.
// This will return a text that will be green or red depending on the completed field
import reqmate from 'reqmate';
import { useState, useEffect } from 'react';

function App(){
    const [todo, setTodo] = useState<React.FC | undefined>(undefined);

    async function loadTodo() {
      const { data } = await reqmate
        .get("https://jsonplaceholder.typicode.com/todos/1")
        .setParser(async (response: Response) => {
          const { title, completed } = await response.json();
          const color = completed ? 'green' : 'red';

          return <p style={{ color }}>{title}</p>;

        })
        .send<React.FC>();

      setTodo(data);
  }

  return (
    <>
      {todo}
      <button onClick={loadTodo}>Load Todo</button>
    </>
  )
}
```

## Caching

ReqMate can cache your http calls, by just calling the setCaching step of the builder, by default if we use setCaching without any param, the request will be cached forever, but if we can set a ttl (in milliseconds) and the cache will expire after that period.

```javascript

// Will cache the entire response forever
   const responseCachedForever = await reqmate
      .get('https://jsonplaceholder.typicode.com/todos')
      .setCaching()
      .send();


// Will cache the result for 3 seconds
   const response = await reqmate
      .get('https://jsonplaceholder.typicode.com/todos/1')
      .setCaching(3000) 
      .send();

// Cached response will resolve automatically because the value is still on the cache
  const cachedResponse = await reqmate
      .get('https://jsonplaceholder.typicode.com/todos/1')
      .send();

```

Retry, types of retries

## Retry

ReqMate have two types of retry strategies (Polling and Timed) and the strategies can be configured to achieve different objectives.

### onResponse and onError

For reading each response, we can pass a callback to the onResponse property, onResponse receives 2 parameters, the first one is the parsed response itself and the second one is the done() function, if we call it, it will stop the process inmediatly and reqmate will resolve with the last value from the polling. The same with the onError property, it will trigger when the request fails.

The above example will call done() on the onResponse given a condition or when it errors out.

### Polling

Polling will start a request when the previous one succeeds or fails untill the maxRetires is reached or the `done()` method is called.

The simples way to do a retry is by using the Polling mechanism as shown in the following example:

```javascript
   const response = await reqmate
      .get('https://jsonplaceholder.typicode.com/todos/3')
      .setRetry({
        type: 'polling',
        maxRetries: 3,
        onResponse: (r, done) => { 
          console.log('RESPONSE: ', r)

          if(r.data.id === 3) {
            done(); 
          }
        },
        onError : (err, done) => {
          console.error(err);
          done();
        }
      })
      .send();

```

This is a way of doing it, by passing an object with the configuration needed for polling.
Polling has the property maxRetries that specify how many requests will be made.

### Timed

Timed will execute a new request given an interval, this makes the strategy more powerful because we can implement different subtypes of strategies like:

- Exponential Backoff : The time between requests will increase exponentially.
- Linear Backoff : The time  between requests will increase by a fixed amount.
- Static Backoff (default) : The time between requests will be the same.
- Random Backoff : The time between requests will be a random number between 2 values with each call.

#### Exponential

Example of Exponential Backoff:

The `doExponentialBackoff` function receives the parameters:

- factor (2 default): Factor to calculate the power of the given interval.
- maxInterval : Maximum value the interval can reach.

> Example: if interval is 1000 miliseconds, the second call will be made at 2000 , the third one at 4000 etc.. (8k, 16k, 32k ...)

```javascript
import reqmate, { Timed } from 'reqmate';

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
```

#### Linear

Example of Exponential Linear:

The `doLinearBackoff` function receives the parameters:

- factor (200 default): A fixed amount of miliseconds that will be added to the request.
- maxInterval : Maximum value the interval can reach.

> Example: if interval is 1000 milliseconds and factor is 200, the next call will be made at 1200, the third one at 1400 etc..

```javascript
import reqmate, { Timed } from 'reqmate';

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

```

#### Static

Example of Static Backoff (default strategy)
> The `doStaticBackoff` function, does not receives any parameters.
All calls will be made with the specified interval.

```javascript


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
```

#### Random

Example of Random backoff

The `doRandomBackoff` receives the parameters

- minInterval : Smaller end of the interval.
- maxInterval : Greater end of the interval.

> Example if called with the parameters 1000 and 5000 all calls will be made with a random interval betwee these two values each time.

```javascript
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
```

#### Custom

The reqmate library comes with a few strategies but you can implement your own. The `intervalCallback` is just a high order function that returns a function that return the interval.

Example of a custom made retry mechanism, this retry will alternate between 1 and 3 seconds for the intervals.

```javascript

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

```

<br/>
<br/>
<br/>
<br/>
<br/>

# Advanced

## Cache

ReqMate comes with a default in memory cache but this can be overriten to use a custom implementation. A cache must implement the ReqMateCache interface:

```typescript
export default interface ReqMateCache {
    has(key: string): Promise<boolean>;
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    get(key: string): Promise<unknown>;
    delete(key: string): Promise<boolean>;
    expire(key: string, ttl: number): void;
    clear(): Promise<void>;
    size(): Promise<number>;
    keys(): Promise<IterableIterator<string>>;
    values(): Promise<IterableIterator<unknown>>;
    entries(): Promise<IterableIterator<[string, unknown]>>;
    forEach(callbackfn: (value: unknown, key: string, map: Map<string, unknown>) => void, thisArg?: unknown): Promise<void>;
    generateKey(data: unknown): Promise<string>;
}

```

As an example, check the implementation below, it will use the localStorage as a cache (this class is just an example)

```typescript

import reqmate from 'reqmate';
import ReqMateCache from 'reqmate/cache/ReqMateCache'

export default class LocalStorageCache implements ReqMateCache {

    constructor(public prefix: string = 'ReqMateCache_') { }

    private async getRaw(key: string): Promise<{ value: unknown, expiration?: number }> {
        const data = localStorage.getItem(this.prefix + key);
        return data ? JSON.parse(data) : null;
    }

    async has(key: string): Promise<boolean> {
        const raw = await this.getRaw(key);
        if (raw && (!raw.expiration || raw.expiration > Date.now())) {
            return true;
        }
        return false;
    }

    async set(key: string, value: unknown, ttl?: number): Promise<void> {
        const item = {
            value,
            expiration: ttl ? Date.now() + ttl * 1000 : undefined,
        };
        localStorage.setItem(this.prefix + key, JSON.stringify(item));
    }

    async get(key: string): Promise<unknown> {
        const raw = await this.getRaw(key);
        if (raw && (!raw.expiration || raw.expiration > Date.now())) {
            return raw.value;
        }
        return null;
    }

    async delete(key: string): Promise<boolean> {
        if (await this.has(key)) {
            localStorage.removeItem(this.prefix + key);
            return true;
        }
        return false;
    }

    expire(key: string, ttl: number): void {
        this.getRaw(key).then(raw => {
            if (raw) {
                raw.expiration = Date.now() + ttl * 1000;
                localStorage.setItem(this.prefix + key, JSON.stringify(raw));
            }
        });
    }

    async clear(): Promise<void> {
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith(this.prefix)) {
                localStorage.removeItem(k);
            }
        });
    }

    async size(): Promise<number> {
        return Object.keys(localStorage).filter(k => k.startsWith(this.prefix)).length;
    }

    async keys(): Promise<IterableIterator<string>> {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix)).map(k => k.substr(this.prefix.length));
        return keys[Symbol.iterator]();
    }

    async values(): Promise<IterableIterator<unknown>> {
        const rawKeys = await this.keys();
        const keys = [...rawKeys];
        const values = keys.map(k => this.get(k));
        return values[Symbol.iterator]();
    }

    async entries(): Promise<IterableIterator<[string, unknown]>> {
        const rawkeys = await this.keys();
        const keys = [...rawkeys];
        const entries = keys.map(k => [k, this.get(k)] as [string, unknown]);
        return entries[Symbol.iterator]();
    }

    async forEach(callbackfn: (value: unknown, key: string, map: Map<string, unknown>) => void, thisArg?: unknown): Promise<void> {
        const map = new Map<string, unknown>();
        const entries = await this.entries();
        for (const [key, value] of entries) {
            map.set(key, value);
        }
        map.forEach(callbackfn, thisArg);
    }

    async generateKey(target: Object): Promise<string> {
        const str = JSON.stringify(target, Object.keys(target).sort());

        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}

```

To use it is just a matter of setting it as cache on reqmate

```typescript

// Set the newly implemented cache as the cache for reqmate.
reqmate.cache = new LocalStorageCache("app_");

    const r = await reqmate
      .get('https://jsonplaceholder.typicode.com/todos/1')
      .setCaching(500000)
      .setRetry({
        type: 'timed',
        maxRetries: 3,
        interval: 1000,
        onResponse: (r) => console.log('RESPONSE: ', r),
        intervalCallback: Timed.doExponentialBackoff()
      })
      .send();

    console.log("HAS: ", await reqmate.cache.has(r.cacheKey!));
    console.log("GET:", await reqmate.cache.get(r.cacheKey!));

```

and the same way you can set the cache for reqmate, you also can get the cache from it like:

```typescript
const cache = reqmate.cache;

console.log(await cache.size())

// or calling it directly
console.log(await reqmate.cache.size())

```

## Retry

### Factory

We can use the retry mechanisms by either creating the correct retry using the `RetryFactory` or by instantiating the especific retry classes ourselves. This retry mechanism can be reused with another promises as we will see.

Creating a Retry object of type polling with the Factory. Objects of type timed can also be created.

```typescript
import RetryFactory from 'reqmate/retry/RetryFactory';

const retry = RetryFactory.build({
        type: 'polling',
        maxRetries: 3,
        onResponse: (r, done) => console.log('RESPONSE: ', r),
        onError : (err, done) =>  console.error(err),
    });

```

### Retry Classes

We can instantiate the `Polling` and `Timed` directly from their own classes and inject then using the `setRetry`.

Check the examples bellow, it uses again the builder pattern to setup the values on a chain before injecting it to reqmate's request. You can do it all in one chain like in the Polling example or instantiate the class first and add the steps to the const like in timed.

```typescript

    async function doPolling() {
        // Doing one chain.
        const polling = (new Polling())
            .onResponse((r) => console.log('RESPONSE: ', r))
            .onError((e) => console.log('ERROR: ', e))
            .setMaxRetries(3);

        const { data } = await reqmate
            .get("https://jsonplaceholder.typicode.com/todos/1")
            .setRetry(polling)
            .send<Record<string, string>>();

        console.log({ data })
    }



    async function doTimed() {
        // Instantiating the class
        const timed = new Timed();

        // Adding the steps.
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

```

### Other usages for retry

The retries mechanisms can be used as an standalone utility to execute promises using these strategies. The keys for this are two other methods:

- `setCallback` : Sets the callback to be executed, this callback is expected to return a promise.
- `execute`: Will trigger the execution.

On the example bellow, we are reading information from a file and the process will stop when the value from the file is the string value '3'.
On the other hand, we are writing into the file a counter that will increase every second, so the reading will stop when the writing puts the value '3' into the file.

```javascript
const fs = require('fs').promises;
const { Polling, Timed } = require('reqmate');


// Test promise for reading a file
async function readFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return data;
    } catch (error) {
        throw new Error(`Could not read the file: ${error.message}`);
    }
}

// Test promise for writing into a file
async function writeFile(filePath, data) {
    try {
        await fs.writeFile(filePath, data, 'utf8');
        console.log('Data successfully written to file.');
    } catch (error) {
        throw new Error(`Could not write to the file: ${error.message}`);
    }
}


async function readTimed() {
    // Will do a Polling on readFile until the value of the file is '3'.
    (new Polling())
        .setCallback(() => readFile('file.txt'))
        .onResponse((r, done) => {
            console.log("READING: ", r)

            if (r === "3") done();
        })
        .execute();

}

async function writeTimed() {
    // Will write the counter into the file with 1 second interval
    let counter = 0;
    const timed = new Timed();
    timed.setInterval(1000)
        .setTimeout(5000)
        .setCallback(() => {
            counter++;
            writeFile('file.txt', `${counter}`)
        })
        .execute();
}

readTimed();
writeTimed();
```
