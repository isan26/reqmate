import './App.css'

import reqmate from '../../../src';

import Polling from '../../../src/retry/Polling';
import Timed from '../../../src/retry/Timed';

import { useState, useEffect } from 'react';


function App() {
  const [state, setState] = useState({})


  function doGet() {
    console.log('doGet')

    console.log("CACHE SIZE: ", reqmate.cache.size)

    const polling = (new Polling())
      .setMaxRetries(3)
      .onResponse((r) => console.log('RESPONSE: ', r));

    reqmate
      .get('http://localhost:3000')
      .setCaching(500)
      // .setRetry(polling)
      // .setRetry({
      //   type: 'polling',
      //   maxRetries: 3,
      //   onResponse: (r) => console.log('RESPONSE: ', r)
      // })
      .setRetry({
        type: 'timed',
        maxRetries: 3,
        interval: 1000,
        onResponse: (r) => console.log('RESPONSE: ', r),
        intervalCallback: Timed.doExponentialBackoff()
      })
      .send()
      .then((r) => {
        console.log(r)
        setState(r.data as any)
      })


  }

  async function doPost() {
    const polling = (new Polling())
      .setMaxRetries(3)
      .onResponse((r) => console.log('RESPONSE: ', r));

    await reqmate
      .post('http://localhost:3000', { name: 'John', lastName: 'Doe' })
      .setRetry(polling)
      .setCaching(2000)
      .send()

    const cachedResponse = await reqmate
      .post('http://localhost:3000', { name: 'John', lastName: 'Doe' })
      .send()

    console.log({ isCached: cachedResponse.cached })

    reqmate.cache.clear()

    const nonCachedResponse = await reqmate
      .post('http://localhost:3000', { name: 'John', lastName: 'Doe' })
      .send()

    console.log({ isCached: nonCachedResponse.cached })
  }

  async function doPut() {
    const r = await reqmate
      .put('http://localhost:3000', { name: 'John', lastName: 'Doe' })
      .send();

    console.log({ r })
  }

  function doDelete() { }

  function doPatch() { }

  return (
    <>
      <pre>
        <code>
          {state && JSON.stringify(state, null, 2)}
        </code>
      </pre>
      <button onClick={doGet}>GET</button>
      <button onClick={doPost}>POST</button>
      <button onClick={doPut}>PUT</button>
    </>
  )
}

export default App
