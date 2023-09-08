HTTP Lib

Builder pattern for doing requests, on top of fetch

Will add,

Cache,
Retry + Polling (long and short)
Parsers // Method that will process the response automatically
Support for streams
Debug Mode.
Implement timeout
Default values for config

// Simple use
lib.post(url, body).addHeader("header", "value").send();

//Timeout
lib.get(url).setTimeout(5000).send(); // Set timeout

// Parser
// If no parser is provided will have some default ones, typical most common used
lib.post(url, body).parse(r => await r.json()).send();
lib.post(url, body).parsers({
    "application/json" => (r) => await r.json(),
    "text/html" => (r) => await r.text(),
}).send()

// Cache
// Will only cache if response is ok.
lib.get(url).caching(5000).send() // TTL 5000 miliseconds

// Retry mechanism
lib.get(url).retry({
    "type" : "long",
    "interval" : 5000 /// miliseconds
    "retries" :  5 // amount of retries, -1 by default meaning non stop
    "onResponse" : (response, stop ) => {} // callback , if true will stop, response is what's back from the server, stop is a callback to "stop"
    "onFailure" : (response, stop) => {}, // callback similar to above to handle failures.
}).send();

Types of retries
// Exponential
// Linear
// Inmediate
// Fixed
// Incremental
// Polling,

// Can use builder pattern
import retry from lib;

const strategy = retry.longPolling().setInterval().retries().onResponse().onError();

lib.get().retry(strategy).send()

Default config values

lib
.get() // Method , GET POST PUT PATCH DELETE
.mode("CORS")
.cache("no-cache")
.credentials("same-origin")
.headers({})
.redirect()
.referrerPolicy("no-referrer")
.body(JSON.stringify(data))
