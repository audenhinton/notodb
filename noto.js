const S3 = require('aws-sdk/clients/s3')

class NotoDB {

    config = {}
    app = null
    s3 = null

    constructor(app, config = {}) {

        this.app = app
        this.config.accessKeyId = config.accessKeyId;
        this.config.secretAccessKey = config.secretAccessKey;
        this.config.bucket = config.bucket;
        this.config.region = config.region || 'us-east-1';

        this.s3 = new S3({
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
            region: this.config.region
        });

    };

    about(req, res) {
        res.send({
            "server": "NotoDB",
            "version": require('./package.json')["version"],
            "message": "Not only a database."
        })
    }

    listBuckets(req, res) {

        this.s3.listBuckets(function (err, data) {

            if (err) {
                return res.status(400).send({
                    message: err.code
                })
            }

            res.send(data)

        });

    }

    listBucketObjects(req, res) {

        this.s3.listObjectsV2({
            Bucket: req.params.bucket
        }, function (err, data) {

            if (err) {
                return res.status(400).send({
                    message: err.code
                })
            }

            res.send(data)

        });

    }

    listSets(req, res) {

        this.s3.listObjectsV2({
            Bucket: req.params.bucket,
            Prefix: "_notodb/"
        }, function (err, data) {

            if (err) {
                return res.status(400).send({
                    message: err.code
                })
            }

            res.send(data.Contents)

        });

    }

    addSet(req, res) {

        if (!req.params.bucket) return res.status(400).send({
            message: "Bucket required."
        })

        if (!req.body.name) return res.status(400).send({
            message: "Set name required."
        })

        this.s3.putObject({
            Bucket: req.params.bucket,
            Key: "_notodb/" + req.body.name,
            Body: JSON.stringify([])
        }, function (err, data) {

            if (err) {
                return res.status(400).send({
                    message: err.code
                })
            }

            res.send({
                "message": `Created empty set '${req.body.name}'`
            })

        });

    }

    removeSet(req, res) {

        console.log(req.params)

        this.s3.deleteObject({
            Bucket: req.params.bucket,
            Key: "_notodb/" + req.params.set
        }, function (err, data) {

            if (err) {
                return res.status(400).send({
                    message: err.code
                })
            }

            res.send({
                "message": `Removed set '${req.params.set}'`
            })

        });

    }

    listItems(req, res) {

        this.s3.getObject({
            Bucket: req.params.bucket,
            Key: "_notodb/" + req.params.set
        }, function (err, data) {

            if (err) {
                return res.status(400).send({
                    message: err.code
                })
            }

            res.send(data.Body.toString())

        });

    }

    addItems(req, res) {

        let self = this;

        self.s3.getObject({
            Bucket: req.params.bucket,
            Key: "_notodb/" + req.params.set
        }, function (err, data) {

            if (err) {
                return res.status(400).send({
                    message: err.code
                })
            }

            let items = JSON.parse(data.Body.toString())

            items.push(req.body)

            self.s3.putObject({
                Bucket: req.params.bucket,
                Key: "_notodb/" + req.params.set,
                Body: JSON.stringify(items)
            }, function (err, data) {

                if (err) {
                    return res.status(400).send({
                        message: err.code
                    })
                }

                res.send({
                    "message": "successfully added item"
                })

            })

        });


    }

    queryItems(req, res) {

        let where_clause = ''

        if (Object.keys(req.query).length > 0) {
            where_clause = " WHERE "

            Object.keys(req.query).forEach((item, index) => {

                let needle = req.query[item]
                let operator = ` = '${needle}' `

                // check to make sure we are comparing the correct type (string, int, float)
                if (parseInt(needle)) operator = ` = ${needle} `
                if (parseFloat(needle)) operator = ` = ${needle} `

                // check for comparison operators
                if (needle.indexOf(":") > -1) {

                    switch (needle.split(":")[0]) {

                        case "like":
                            operator = ` LIKE '%${needle.split(":")[1]}%' `
                            break;

                        case "start":
                            operator = ` LIKE '${needle.split(":")[1]}%' `
                            break;

                        case "end":
                            operator = ` LIKE '%${needle.split(":")[1]}' `
                            break;

                        case "gt":
                            operator = ` > ${needle.split(":")[1]} `
                            break;

                        case "lt":
                            operator = ` < ${needle.split(":")[1]} `
                            break;

                        case "gte":

                            // these need validation so that users can only use these operators on int & float

                            operator = ` >= '${needle.split(":")[1]}' `
                            if (parseInt(needle)) operator = ` >= ${needle} `
                            if (parseFloat(needle)) operator = ` >= ${needle} `

                            break;

                        case "lte":

                            operator = ` <= '${needle.split(":")[1]}' `
                            if (parseInt(needle)) operator = ` <= ${needle} `
                            if (parseFloat(needle)) operator = ` <= ${needle} `

                            break;

                    }

                }

                where_clause = where_clause + ((index === 0) ? "" : "AND") + " s." + item + operator

            });

        }

        const params = {
            Bucket: req.params.bucket,
            Key: "_notodb/" + req.params.set,
            ExpressionType: 'SQL',
            Expression: "SELECT * FROM S3Object[*][*] s " + where_clause,
            InputSerialization: {
                JSON: {
                    Type: 'DOCUMENT',
                }
            },
            OutputSerialization: {
                JSON: {
                    RecordDelimiter: ','
                }
            }
        }


        this.s3.selectObjectContent(params, function (err, data) {

            let records = []

            data.Payload.on('data', (event) => {

                if (event.Records) {
                    records.push(event.Records.Payload);
                }

            }).on('error', (err) => {

                console.log(err);

            }).on('end', () => {

                let results = Buffer.concat(records).toString('utf8');
                results = results.replace(/\,$/, '');
                results = `[${results}]`;

                res.send(results)

            });

        });

    }

    updateItems(req, res) {

        var self = this;

        self.s3.getObject({
            Bucket: req.params.bucket,
            Key: "_notodb/" + req.params.set
        }, function (err, data) {

            if (err) {
                return res.status(400).send({
                    message: err.code
                })
            }

            var items = JSON.parse(data.Body.toString())
            var update_count = 0
            var count = items.length
            var count_i = 0

            items.forEach((item, i) => {

                let match = true

                // check if filters need to be applied to only update select items
                if (req.query) {
                    Object.keys(req.query).forEach((query_item, query_i) => {
                        if (item[query_item] != req.query[query_item]) match = false;
                    })
                }

                if (match && req.body) {
                    update_count++
                    Object.keys(req.body).forEach((update_item, update_i) => {
                        items[i][update_item] = req.body[update_item]
                        if(!req.body[update_item]) delete(items[i][update_item])
                    })

                }

                if (count_i === count - 1) {

                    // updates have been made - reupload the set
                    self.s3.putObject({
                        Bucket: req.params.bucket,
                        Key: "_notodb/" + req.params.set,
                        Body: JSON.stringify(items)
                    }, function (err, data) {

                        if (err) {
                            return res.status(400).send({
                                message: err.code
                            })
                        }

                        res.send({
                            "message": `Updated ${update_count} item${(update_count === 1) ? "" : "s"} out of ${count_i + 1} scanned items.`
                        })

                    });

                } else {
                    count_i++
                }

            })


        });

    }

}
module.exports = NotoDB