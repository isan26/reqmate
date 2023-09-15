// @ts-ignore
Bun.serve({
    development: true,
    async fetch(req: Request) {
        console.log("REQUEST: ", req.method);
        const headers = new Headers();
        headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
        headers.append('Access-Control-Allow-Headers', 'Content-Type')
        headers.append('Content-Type', 'application/json');


        let body = undefined;
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            body = req.headers.get('content-type') === 'application/json'
                ? await req.json()
                : await req.text();
        }


        const response = JSON.stringify({
            body,
            date: Date.now(),
            headers: Object.fromEntries(req.headers.entries()),
        });

        return new Response(response, {
            headers
        });
    },
});
