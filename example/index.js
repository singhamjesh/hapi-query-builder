'use strict';

const Hapi = require('@hapi/hapi');

const init = async function () {
 try {
  const server = new Hapi.server({ port: 5000 });
  await server.register({
   plugin: require('../index'),
   options: {
    defaultLimit: 20,
   },
  });
  // Add a route - handler and route definition is the same for all versions
  server.route({
   method: 'GET',
   path: '/query',
   handler: function (request, h) {
    // Return the mongoose query which was requested in query params
    return {
     query: request.parsedQuery,
    };
   },
  });

  // Start the server
  await server.start();
  console.log('Server running at:', server.info.uri);
 } catch (err) {
  console.error(err);
  process.exit(1);
 }
};

init();
