import reqmate from '../../../src';

const URL = 'http://localhost:3000?name=hello'

async function main() {
    await reqmate.get(URL).setCaching().send();
    const { data, cached } = await reqmate.get(URL).send();
    console.log({ get: { data, cached } });

    const post = await reqmate
        .post(URL, { payload: "hello" })
        .setCaching()
        .setParser(r => r.status === 200)
        .send();

    const post2 = await reqmate
        .post(URL, { payload: "hello" })
        .send();


    console.log({ post: post.data });
    console.log({ post2: post2.data });

}


main();
