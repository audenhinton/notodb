const S3 = require('aws-sdk/clients/s3')
const nanoid1 = require('nanoid')
const nanoid = nanoid1.customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 16)


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

            res.send(data.Buckets)

        });

    }

    createBucket(req, res) {

        this.s3.createBucket({
            Bucket: req.body.name
        },function (err, data) {

            if (err) {
                return res.status(400).send({
                    message: err.code
                })
            }

            res.send({
                "message": "Created bucket"
            })

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

            let sets = []

            data.Contents.forEach((item) => {
                sets.push({
                    "Name": item.Key.replace("_notodb/", ""),
                    "LastModified": item.LastModified,
                    "Size": item.Size
                })
            })

            res.send(sets)

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

            // check system attributes
            items.forEach((item, i) => {
                items[i]._id = (items[i]._id) ? items[i]._id : nanoid()
                items[i]._createdAt = (items[i]._createdAt) ? items[i]._createdAt : Date.now()
                items[i]._updatedAt = (items[i]._updatedAt) ? items[i]._updatedAt : Date.now()
            })

            Object.keys(req.body).forEach((key) => {
                if(key.startsWith("_")){
                    delete req.body[key]
                }
            })

            req.body._id = nanoid()
            req.body._createdAt = Date.now()
            req.body._updatedAt = Date.now()

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
                let operator = (needle.match(/^-?[0-9]\d*(\.\d+)?$/)) ? ` = ${needle} ` : ` = '${needle.replace(/(^"|"$)/g, '')}' ` 
                
                // check for comparison operators
                if (needle.indexOf(":") > -1) {

                    let value = needle.split(":")[1].replace(/(^"|"$)/g, '')

                    switch (needle.split(":")[0]) {

                        case "like":
                            operator = ` LIKE "%${value}%" `
                            break;

                        case "start":
                            operator = ` LIKE "${value}%" `
                            break;

                        case "end":
                            operator = ` LIKE "%${value}" `
                            break;

                        case "gt":

                            operator = (value.match(/^-?[0-9]\d*(\.\d+)?$/)) ? ` > ${value} ` : ` > '${value}' `

                            break;

                        case "lt":

                            operator = (value.match(/^-?[0-9]\d*(\.\d+)?$/)) ? ` < ${value} ` : ` < '${value}' `

                            break;

                        case "gte":
                            operator = (value.match(/^-?[0-9]\d*(\.\d+)?$/)) ? ` >= ${value} ` : ` >= '${value}' `

                            break;

                        case "lte":

                            operator = (value.match(/^-?[0-9]\d*(\.\d+)?$/)) ? ` <= ${value} ` : ` <= '${value}' `

                            break;

                    }

                }

                where_clause = where_clause + ((index === 0) ? "" : "AND") + " s.\"" + item + "\"" + operator

            });

        }

        let select_clause = '*'

        if(Object.keys(req.body).length > 0){
            select_clause = ''
            Object.keys(req.body).forEach((select_item, select_i) => {
                select_clause = select_clause + select_item + '(' + (select_item !== "*" ? "s." : "") + req.body[select_item] + '),'
            })
        }

        select_clause = select_clause.replace(/,\s*$/, "")

        console.log("SELECT " + select_clause + " FROM S3Object[*][*] s " + where_clause)
        
        const params = {
            Bucket: req.params.bucket,
            Key: "_notodb/" + req.params.set,
            ExpressionType: 'SQL',
            Expression: "SELECT " + select_clause + " FROM S3Object[*][*] s " + where_clause,
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

            console.log(where_clause)

            if(err){
                console.log(err)
                console.log(where_clause)
            }

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

                results = results || []

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
                        if(!update_item.startsWith("_")){
                            items[i][update_item] = req.body[update_item]
                            items[i]._updatedAt = Date.now()
                            if(!req.body[update_item]) delete(items[i][update_item])
                        }
                    })

                }

                item._id = (item._id) ? item._id : nanoid()
                item._createdAt = (item._createdAt) ? item._createdAt : Date.now()
                item._updatedAt = (item._updatedAt) ? item._updatedAt : Date.now()

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

    removeItems(req, res) {

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

            var to_delete = []

            items.forEach((item, i) => {

                let match = true

                // check if filters need to be applied to only update select items
                if (req.query) {
                    Object.keys(req.query).forEach((query_item, query_i) => {
                        if (item[query_item] != req.query[query_item]) match = false;
                    })
                } else {
                    res.status(400).send({
                        "message": `You must provide at least one filter parameter.`
                    })
                }

                if (match) {
                    update_count++
                    to_delete.push(i)
                }

                if (count_i === count - 1) {

                    to_delete.forEach((i) => {
                        items.splice(i, 1)
                    })

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
                            "message": `Deleted ${update_count} item${(update_count === 1) ? "" : "s"} out of ${count_i + 1} scanned items.`
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