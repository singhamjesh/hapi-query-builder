# Universal query builder for Hapi.js

Hapi-query-builder is a Hapi.js plugin. It is an ambitious attempt to create a
kind of "URL" to "Mongoose query" translator which provides a mongoose query for
GET API. It provides facilities to the developer to pass query params in URL and
get the mongoose query.

#### The primary benefits of this plugin (currently) are:

- Ability to convert directory query params to mongoose get query.
- Supports all get query command of mongoose (like- pagination and populate)
- Automatically identify where condition and option from query params.
- You can access mongoose query in request parameter with name "parsedQuery". It
  is object witch hold where and option keys.
- For better experience use "mongoose-paginate-v2" npm package.

## Installation

You can add the module to your Hapi using npm:

```bash
 npm i hapi-query-builder --save
```

## Compatibility

node: >= 18.x.x,  
hapi: >= 21.x.x

## Quick start

In your Hapi apps `server` object simply add `hapi-query-builder` and also add
the routes for your API as described on the hapijs.com site.

```Javascript
const Hapi = require('@hapi/hapi');

(async () => {
    try{
        const server = await new Hapi.Server({
            host: 'localhost',
            port: 3000,
        });

        await server.register({
            plugin: require('hapi-query-builder'),
            options: {
                defaultSelectField: '_id', // (optional)- Pass field name for default select if $select is empty
            },
        });

        server.route({
            method: 'GET',
            path: '/query',
            handler: function (request, h) {
                return {
                    query: request.parsedQuery,
                };
            },
        });

        await server.start();
        console.log('Server running at:', server.info.uri);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
```

### Example

You just pass query in query params form Front-end in request.

```
const axios = require('axios');

const response = axios.get('/user?email=example@email.com&$limit=10&$skip=1&$sort=updatedAt|-1');
```

You can get mongoose query in handler in hapi.js

```
 handler: function (request, h) {
   query: request.parsedQuery,
 };


// example response
{"where":{"email":"example@email.com"},"options":{"lean":true,"offset":1,"limit":10,"sort":{"updatedAt":"-1"}}}

```

## Documentation

### Where

Passing DB field name (Get all record where field match with value)

```
- GET       /api-path?field1=value&field2=value&.....fieldn=value
- Ex        /user?_id=5ff48a66070a2466418e6adc&email=example@email.com
- Result    {"where":{"_id":"5ff48a66070a2466418e6adc","email":"example@email.com"},"options":{"lean":true,"offset":0,"limit":20,"sort":{}}}
```

### Or operator

Passing DB field name ($or condition for mongodb)

```
- GET       /api-path?$or=field1|value,field2|value,.....,fieldn|value
- Ex        /user?$or=_id|5ff48a66070a2466418e6adc,email|example@email.com
- Result    {"where":{"$or":[{"_id":"5ff48a66070a2466418e6adc"},{"email":"example@email.com"}],"options":{"lean":true,"offset":0,"limit":20,"sort":{}}}
```

### Select field value

Passing DB field name with space in $select

```
- GET       /api-path?$select=field1 field2 field3..... fieldn
- Ex        /user?$select=_id email title name
- Result    {"where":{},"options":{"select":"_id email title name","lean":true,"offset":0,"limit":20,"sort":{}}}
```

### Search query($q) (in given fields)

Passing search text with DB fields name with pip operator in $q

```
- GET       /api-path?$q=text|field1,field2....fieldn
- Ex        /user?$q=amjesh|email,name
- Result    {{"where":{"$or":[{"email":{"$regex":"amjesh","$options":"i"}},{"name":{"$regex":"amjesh","$options":"i"}}]},"options":{"lean":true,"offset":0,"limit":20,"sort":{}}}
```

### Search with case sensitive

Passing DB field name and search value with pip operator in $search

```
- GET       /api-path?$search=field|value,field1|value,....fieldn|value
- Ex        /user?$search=name|Amjesh,email|amjesh@example.com
- Result    {"where":{"name":{"$regex":/Amjesh/}},"options":{"lean":true,"offset":0,"limit":20,"sort":{}}}
```

### Search without case sensitive

Passing DB field name and search value with pip operator in $isearch

```
- GET       /api-path?$isearch=field|value,field1|value,...fieldn|value
- Ex-       /user?$isearch=name|Amjesh,email|amjesh@example.com
- Result    {"where":{"name":{"$regex":/amjesh/,"$options":"i"}},"options":{"lean":true,"offset":0,"limit":20,"sort":{}}}
```

### Populate

Passing modal with comma separated in $populate

```
- GET       /api-path?$populate=modal1,modal2,....modaln
- Ex        /user?$populate=post,comment
- Result    {"where":{},"options":{"populate":["post","comment"],"lean":true,"offset":0,"limit":20,"sort":{}}}
```

### Sort

Passing DB field name for shorting in $sort  
_For Ascending pass value 1 or asc and_  
_For Descending pass value -1 or desc any one_

```
- GET       /api-path?$sort=field1|1,field2|1
- Ex        /user?$sort=updatedAt|1,_id|1
- Result    {"where":{},"options":{"lean":true,"offset":0,"limit":20,"sort":{"updatedAt":"1","_id":"1"}}}
            OR
- GET       /api-path?$sort=field1|-1,field2|-1
- Ex        /user?$sort=updatedAt|-1,_id|-1
- Result    {"where":{},"options":{"lean":true,"offset":0,"limit":20,"sort":{"updatedAt":"-1","_id":"-1"}}}
```

### Skip(optional)

Skip record for pagination in $skip(By default it's 0)

```
- GET       /api-path?$skip=value
- Ex        /user?$skip=1
- Result    {"where":{},"options":{"lean":true,"offset":1,"limit":20,"sort":{}}}
```

### Limit(optional)

Passing limit for total number of record for pagination in $limit.  
You can pass defaultLimit in plugin option

```
- GET       /api-path?$limit=value
- Ex        /user?$limit=100
- Result    {"where":{},"options":{"lean":true,"offset":0,"limit":100,"sort":{}}}
```

### IN or NOT IN

Get all records where the value does $in(In) or does not $nin(Not-in) match from
values

```
- GET       /api-path?field[$in]=value1,value2.....valuen
- Ex        /user?id[$in]=10,11,12,13,14
- Result    {"where":{"id":{"$in":["10","11","12","13","14"]}},"options":{"lean":true,"offset":0,"limit":20,"sort":{}}}
```

### GT Or GTE

Get all records where the value does $gt(Greater then) or does not $gte(Greater
then equal to) match from value

```
- GET       /api-path?field[$gt]=value
- Ex        /user?comment[$gt]=100
- Result    {"where":{"comment":{"$gt":"100"}},"options":{"lean":true,"offset":0,"limit":20,"sort":{}}}
```

### LT or LTE

Get all records where the value does $lt(Less then) or does not $lte(Less then
equal to) match from value

```
- GET       /api-path?field[$lt]=value
- Ex        /user?likes[$lt]=100
- Result    {"where":{"likes":{"$lt":"100"}},"options":{"lean":true,"offset":0,"limit":20,"sort":{}}}
```

### NE

Get all records where the value does $ne(not equal to) match from value

```
- GET       /api-path?field[$ne]=value
- Ex        /user?archive[$ne]=true
- Result    {"where":{"archive":{"$ne":true}},"options":{"lean":true,"offset":0,"limit":20,"sort":{}}}
```

