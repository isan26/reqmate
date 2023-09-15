# reqmate

Uncomplicated and extensible HTTP client lib on top of fetch with caching and retry mechanisms. It works on browser, nodejs, Bun, etc..

## Table of Contents

- [Basic Usage](#basic-usage)
  - [Basic Example](#basic-example)

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

The response object contains:

- ok: Boolean value, true if request is a success (is the standard fetch ok field)
- status : Number value, status code of the request
- headers : Object with the headers.
- cached : Boolean value, will be true if the request was cached
- cacheKey (optional) : String, string value with the cache key.
- data : Result from parsing the response from the server

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

ReqMate can cache your http calls, but just calling the setCaching step of the builder, by default if we use setCaching without any param, the request will be cached forever, but if we can set a ttl (in milliseconds) and the cache will expire after that period.

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

Example

Advanced
 advanced caching
 reimplementing cache and setting it up as default
 advanced retry
 reuse and extend
