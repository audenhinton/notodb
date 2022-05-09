
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
GET /buckets/[BUCKET NAME]
```

List all sets in NotoDB. Think of sets as collections or tables.

```
GET /buckets/[BUCKET NAME]/sets
```

Create a new empty set in NotoDB.

```
POST /buckets/[BUCKET NAME]/sets

{
    "name": "[YOUR SET NAME]"
}
```

Delete a set

```
DELETE /buckets/[BUCKET NAME]/sets
```

Get items from a set. Think of items as rows in a table, or documents in a collection.

```
GET /buckets/[BUCKET NAME]/sets/[SET NAME]/items
```

Add new items to a set. Example payload. Data is stored in JSON documents, there is no limit to number of keys your items can have.

```
POST /buckets/[BUCKET NAME]/sets/[SET NAME]/items

{
    "first_name": "John",
    "last_name": "Wick",
    "email": "john.wick@contintental.com"
}
```

Query items in a set.

```
GET /buckets/[BUCKET NAME]/sets/[SET NAME]/query?[KEY1]=[VALUE]&[KEY2]=[VALUE]

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
