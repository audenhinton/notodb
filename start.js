const express = require('express')
const serverless = require('serverless-http')

const NotoDB = require('./noto')

const isLambda = !!process.env.LAMBDA_TASK_ROOT;

const app = express()

app.use((req, res, next) => {

    // check if any required parameters are missing from the request
    if (!req.headers["x-access-key-id"]) res.status(400).send({ "message": "Missing x-access-key-id header" })
    if (!req.headers["x-secret-access-key"]) res.status(400).send({ "message": "Missing x-secret-access-key header" })

    Noto = new NotoDB(app, config = {
        accessKeyId: req.headers["x-access-key-id"],
        secretAccessKey: req.headers["x-secret-access-key"],
        region: "us-east-1"
    })

    res.setHeader("Content-Type", "application/json")

    next()

})
app.use(express.urlencoded());
app.use(express.json());

app.get("/", (req, res) => { Noto.about(req, res) })

// S3 specific methods
app.get("/buckets", (req, res) => { Noto.listBuckets(req, res) })
app.get("/:bucket", (req, res) => { Noto.listBucketObjects(req, res) })

// NotoDB specific methods
app.get("/:bucket/sets", (req, res) => { Noto.listSets(req, res) })
app.put("/:bucket/sets", (req, res) => { Noto.addSet(req, res) })
app.delete("/:bucket/sets/:set", (req, res) => { Noto.removeSet(req, res) })

app.get("/:bucket/sets/:set/items", (req, res) => { Noto.listItems(req, res) })
app.put("/:bucket/sets/:set/items", (req, res) => { Noto.addItems(req, res) })

app.post("/:bucket/sets/:set/query", (req, res) => { Noto.queryItems(req, res) })

app.patch("/:bucket/sets/:set/items", (req, res) => { Noto.updateItems(req, res) })

if (isLambda) {
    module.exports.handler = serverless(app);
} else {
    app.listen(8080)
}

