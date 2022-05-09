
# NotoDB

A serverless, lightweight NoSQL database that sits on top of Amazon S3. 



## Features

- Use your Amazon S3 buckets for NotoDB data storage
- NotoDB will allow you to create, read, update, and delete data sets stored in S3
- Query nested items within your JSON files in the `_notodb` folder in your S3 bucket
- You can add NotoDB to an existing S3 bucket
- NotoDB is lightweight and built to run in a single AWS Lambda function
- A hosted version of NotoDB will be available soon


## Installation

NotoDB is easy to install. Run the following in the project's root folder.

```bash
  npm install
```

To start the server run the following command. Your local server will be running on `http://localhost:8080`

```bash
  npm run start
```

If you would like to deploy NotoDB to lambda, you can run the following command. Make sure you have a lambda function running in your AWS instance with Node version 14+.

```bash
  npm run deploy
```


## Authentication

To point NotoDB to your Amazon S3 bucket, include the following headers in your http requests to the API.

`x-access-key-id` - your IAM user's access Key ID

`x-secret-access-key` - your IAM user's secrect access key



## API methods & endpoints

List buckets in S3. Useful for testing connectivity.

```
GET /buckets
```

List contents of a bucket in S3. Useful for testing connectivity.

```
GET /{bucket}
```

List all sets in NotoDB. Think of sets as collections or tables.

```
GET /{bucket}/sets
```

Create a new empty set in NotoDB.

```
PUT /{bucket}/sets

{
    "name": "setName"
}
```

Delete a set

```
DELETE /{bucket}/sets
```

Get items from a set. Think of items as rows in a table, or documents in a collection.

```
GET /{bucket}/sets/{set}/items
```

Add new items to a set. Example payload. Data is stored in JSON documents, there is no limit to number of keys your items can have.

```
PUT /{bucket}/sets/{set}/items

{
    "first_name": "John",
    "last_name": "Wick",
    "email": "john.wick@contintental.com"
}
```
Update items in a set. Use URL parameters to filter which items to update. Use the PATCH payload to create, update, or delete item attributes. Leaving an attribute empty will remove it from an item. The below query will update the `last_name` attribute where `first_name` is equal to `John`.


**Caution**: updates can become prohibitively expensive on larger datasets. 

```
PATCH /{bucket}/sets/{set}/items?first_name=John

{
    "last_name": "McLovin"
}
```

Query or search for items in a set.

```
POST /{bucket}/sets/{set}/query?{someKey1}={value}&{someKey2}={value}

{
    "count": "*",
    "avg": "age"
}

```
You can query against any top-level keys in your items. We are working on adding queries for nested items. You can also use operators for matching and compairing values. Below is a list of available operators and how to use them.

Operator | example
--- | ---
equals | ?first_name=John&last_name=Wick 
contains | ?first_name=like:John 
starts with | ?first_name=start:John 
ends with | ?first_name=end:John 
greater than | ?age=gt:30 
greater than or equal to | ?age=gte:30 
less than | ?age=lt:30 
less than or equal to | ?age=lte:30 

You can chain filters and operators together to filter your data further.
