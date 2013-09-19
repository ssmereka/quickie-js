/* Server.js
 * Creates, configures, and starts the node.js server.
 */

var load = require("../libs/loading");    // Require a library to help setup & configure the server.

load.app(function(err, app, config, db) { // Create and configure our application, configuration, and database objects.
  if(err) { 
    return console.log(err.red);          // If there was an error, we can't start the server so quite and show the error message.
  }

  load.passport();                        // Load and configure passport for authentication.

  // Set the order of your routes.
  config.routes.push("controller");       // Load all non-static controllers.
  config.routes.push("error");            // Finally, load an error handler.  If no other routes handle the request, then the error handler will step in.

  load.routes(function(err, success) {    // Dynamically require all of our routes in the correct order.
    load.server();                        // Start the server.
  });
});
