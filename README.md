# Universal query builder for Hapi.js
Hapi-query-builder is a Hapi.js  plugin. It is an ambitious attempt to create a kind of "URL" to "Mongoose query" translator which provides a mongoose query for GET API. It provides facilities to the developer to pass query params in URL and get the mongoose query. 

#### The primary benefits of this plugin (currently) are:    
 * Ability to convert directory query params to mongoose get query.
 * Supports all get query command of mongoose (like- pagination and populate)
 * Automatically identify where condition and option from query params.
 * You can access mongoose query in request parameter with name "parsedQuery". It is object witch hold where and option keys.
 * For better experience use "mongoose-paginate-v2" npm package.


## Installation

You can add the module to your Hapi using npm:

```bash
 npm i hapi-query-builder --save
```

## Compatibility
node: >= 12.20.1,  
hapi: >= 18.x.x


## Quick start

In your Hapi apps `server` object simply add `hapi-query-builder` and also add the routes for your API as described on the hapijs.com site.

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
                defaultLimit: 20,
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
Passing DB field name and match value without dollar symbol   
```     
* /api-path?field1=value&field2=value&.....fieldn=value   
* Ex- /user?_id=5ff48a66070a2466418e6adc&email=example@email.com 

``` 

### Select field value
Passing DB field name with space in $select    
```    
* /api-path?$select=field1 field2 field3..... fieldn        
* Ex- /user?$select=_id email title name        
````   

### Search with case sensitive    
Passing DB field name and search value with pip operator in $search     
```
* /api-path?$search=field|value
* Ex- /user?$search=name|mohan
```

### Search without case sensitive
Passing DB field name and search value with pip operator in $isearch 
```
* /api-path?$isearch=field|value
* Ex- /user?$isearch=name|Mohan
```

### Populate
Passing modal with comma separated in $populate    
```
* /api-path?$populate=modal1,modal2,....modaln
* Ex- /user?$populate=post,comment
```

### Sort
Passing DB field name for shorting in $sort     
_For Ascending pass value 1 or_             
_For Descending pass value -1_     
```   
* /api-path?$sort=field|1 or    
* /api-path?$sort=field|-1    
* Ex- /user?$sort=updatedAt|1 or    
* Ex- /user?$sort=updatedAt|-1    
```   

### Skip
Skip record for pagination in $skip(By default it's 0)   
```
* /api-path?$skip=value
* Ex- /user?$skip=1
```

### Limit
Passing limit for total number of record for pagination in $limit.                            
You defaultLimit must be pass in plugin option                    
```
* /api-path?$limit=value
* Ex- /user?$limit=100
```

### Version
You can also pass v1 and v2 for hapi-query-builder version                               
If you do not pass v1 or v2 in query params it's by default use version 1                             
```
* /api-path?v=value
* Ex- /user?$v=2
```

## Thanks

I would like to thank all of you.

