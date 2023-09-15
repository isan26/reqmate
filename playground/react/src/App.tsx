import './App.css'

import reqmate from '../../../src';

import Polling from '../../../src/retry/Polling';
import Timed from '../../../src/retry/Timed';

import { useState, useEffect } from 'react';


function App() {
  const [state, setState] = useState({})

  const [todo, setTodo] = useState<React.FC | undefined>(undefined);

  // async function loadTodo() {
  //   const { data } = await reqmate
  //     .get("https://jsonplaceholder.typicode.com/todos/1")
  //     .setParser(async (response: Response) => {
  //       const { title, completed } = await response.json();
  //       return `${title} \n is ${completed ? "Completed" : "Not Completed"}`;
  //     })
  //     .send<string>();

  //   setTodo(data);
  // }


  async function loadTodo() {
    const res = await reqmate
      .get("https://jsonplaceholder.typicode.com/todos/1")
      .setParser(async (response: Response) => {
        const { title, completed } = await response.json();
        const color = completed ? 'green' : 'red';

        return <p style={{ color }}>{title}</p>;

      })
      .send<React.FC>();

    console.log({ res: JSON.stringify(res, null, 10) })

    setTodo(res.data);
  }


  async function doGet() {
    console.log('doGet')

    console.log("CACHE SIZE: ", await reqmate.cache.size())

    // const polling = (new Polling())
    //   .setMaxRetries(3)
    //   .onResponse((r) => console.log('RESPONSE: ', r));

    const r = await reqmate
      .get('http://localhost:3000')
      .setCaching(500000)
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
      .send();

    console.log(r)
    setState(r.data as any)

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

  async function doPatch() {
    const patching = await reqmate
      .patch('http://localhost:3000', { name: 'John', lastName: 'Doe' })
      .setRetry((new Polling()).setMaxRetries(3).onResponse((r) => console.log('PATCH RESPONSE: ', r)))
      .send();

    setState(patching.data as any)
  }


  function doDelete() {
    reqmate
      .delete('http://localhost:3000')
      .setRetry({
        type: 'timed',
        maxRetries: 30,
        interval: 1000,
        onResponse: (r) => console.log('DELETE: ', r),
        timeout: 30_000,
        intervalCallback: Timed.doLinearBackoff(1000, 3000)
      })
      .send()
      .then((r) => {
        console.log(r)
        setState(r.data as any)
      })

  }

  return (
    <>
      <pre>
        <code>
          {state && JSON.stringify(state, null, 2)}
        </code>
      </pre>
      {todo}
      <button onClick={loadTodo}>Load Todo</button>
      <button onClick={doGet}>GET</button>
      <button onClick={doPost}>POST</button>
      <button onClick={doPut}>PUT</button>
      <button onClick={doPatch}>PATCH</button>
      <button onClick={doDelete}>DELETE</button>
    </>
  )
}

export default App
