
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
Update items in a set. Use URL parameters to filter which items to update. Use the PATCH payload to create, update, or delete item attributes. Leaving an attribute empty will remove it from an item. The below query will update the `last_name` attribute where `first_name` is equal to `John`.


**Caution**: updates can become prohibitively expensive on larger datasets. 

```
PATCH /buckets/[BUCKET NAME]/sets/[SET NAME]/items?first_name=John

{
    "last_name": "McLovin"
}
```

Query or search for items in a set.

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
