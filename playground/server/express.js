const express = require('express')
const app = express();
const bodyParser = require('body-parser');

// app.use(express.json())
// app.use(bodyParser.urlencoded({ extended: true }));


app.use((req, res, next) => {
    // Set the necessary CORS headers
    res.header('Access-Control-Allow-Origin', '*'); // Allow any origin
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS'); // Allow methods
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With'); // Allow headers

    // Intercepts OPTIONS method
    if ('OPTIONS' === req.method) {
        // Respond with 200 (OK) without sending any additional content
        res.sendStatus(200);
    } else {
        // Move to the next middleware or route
        next();
    }
});


app.get('/', (req, res) => {
    console.log("GET", req.params)
    res.send({
        METHOD: "GET",
        time: Date.now()
    })
})
app.post('/', (req, res) => {
    console.log("POST", req.params, req.body)
    res.send({
        METHOD: "POST",
        time: Date.now(),
        BODY: req.body
    })
})
app.put('/', (req, res) => {
    console.log("PUT", req.params, req.body)
    res.send({
        METHOD: "PUT",
        time: Date.now(),
        BODY: req.body
    })
})
app.patch('/', (req, res) => {
    console.log("PATCH", req.params, req.body)
    res.send({
        METHOD: "PATCH",
        time: Date.now(),
        BODY: req.body
    })
})
app.delete('/', (req, res) => {
    console.log("DELETE", req.params)
    res.send({
        METHOD: "DELETE",
        time: Date.now(),
    })
})

app.listen(3000, () => {
    console.log(`Example app listening on port ${3000}`)
})
