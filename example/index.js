const Hapi = require('@hapi/hapi');

const init = async function () {
  try {
    const server = new Hapi.server({ port: 9001 });
    await server.register({
      plugin: require('../index'),
      options: {
        defaultSelectField: '_id',
      },
    });
    // Add a route - handler and route definition is the same for all versions
    server.route({
      method: 'GET',
      path: '/query',
      handler: function (request, h) {
        // Return the mongoose query which was requested in query params
        return h
          .response({
            statusCode: 200,
            message: `See query in response data`,
            data: request.parsedQuery,
          })
          .code(200);
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
