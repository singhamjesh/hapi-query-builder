# hapi-query-builder
The hapi-query-builder hapi.js to get all query from url and create mongoose query.

## Installation

You can add the module to your Hapi using npm:

```bash
> npm i hapi-query-builder --save
```

## Compatibility
"node": ">=12.20.1"
"@hapi/hapi": ">=18.x.x"


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
## Thanks

I would like to thank all of you.
