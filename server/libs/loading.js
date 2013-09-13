/* Loading Module
 */


/**
 * Create our application, configuration, and database objects.
 * Also handle initial configurations for our application and express.
 * Finally connect to the database.
 */
exports.app = function(next) {
  // Load the config object. The config file holds all our applicaiton's settings.
  var configModule = require('../configs/config');
  var config = configModule.config();
  
  // Make sure we loaded a config object before we try to use it.
  if(config === undefined) {
    return next(new Erorr("Could not load config module."));
  }

  // Require some modules we will use.
  var colors           = require(config.paths.nodeModulesFolder + "colors"),            // Display color strings in console.log();
      express          = require(config.paths.nodeModulesFolder + "express"),           // Express will handle our sessions and routes at a low level.
      expressValidator = require(config.paths.nodeModulesFolder + 'express-validator'); // Express validator will assist express.

  // Create and return an application object created by express.
  // We use module.exports as opposed to exports so that we can use
  // the "app" object as a function.  (Reference: http://goo.gl/6yzmKc)
  var app = module.exports = express(); 

  // Handle configuration and setup for different server enviorment modes. (Such as local, development, and production).
  var success = configModule.configureEnviorment(require("../app/node_modules/express"), app, config);
  if(! success) {
    return next(new Error("Could not load config enviorment"));
  }

  // If in debug mode, notify the user it was turned on.
  log_d("Debug mode activated", config);

  // Setup express.
  app.use(express.cookieParser());  // Setup express: enable cookies.
  app.use(express.bodyParser());    // Setup express: enable body parsing.
  //app.use(expressValidator);        // Setup express validator.

  // Configure and connect to the database.
  database(app, config, function(err, db) {
    next(err, app, config, db);   // Return the app, config, and database objects.
  });
}


/**
 * Setup and connect to the database configured in the
 * server config file.  Return a database object once
 * connected, or an error.
 */
var database = function(app, config, next) {
  
  // If our database connection could take some time.
  // then notify the user we are waiting for the database conneciton.
  if(config.enviorment !== "local") {
    log_i("Connecting to database...");
  }

  // If we our use a Mongo DB
  if(config.mongodb.enabled) {                                         // If we are configuring a Mongo database.
    
    // Load any modules used below.
    var express = require(config.paths.nodeModulesFolder + 'express'), 
        mongoose = require(config.paths.nodeModulesFolder + 'mongoose'),
        MongoStore = require(config.paths.nodeModulesFolder + 'connect-mongo')(express);

    // Setup a Mongo Session Store, this will define the database
    // settings and event actions.
    var mongoSessionStore = new MongoStore({                           // Setup a mongo session store and code to run on a connection.
      url: config.mongodb.uri,                                         // Store the uri to connect to the database.
      auto_reconnect: true                                             // Enable auto reconnect if the database connection is lost.
    }, function() {                                                    // This function is called after a successful connection is setup by mongo-connect.
      mongoose.connect(config.mongodb.uri);                            // Finally, connect to the MongoDB Database.
      
      mongoose.connection.on('open', function() {                      // Once the connection is opened.
        log_s("Connected to the database.");
        if(next !== undefined) {
          next(undefined, mongoose);                                   // Return our connection object (in this case it is just mongoose).
        }
      });

      mongoose.connection.on('close', function() {
        log_e("Database connection closed.");
      });

      mongoose.connection.on('error', function(err) {
        log_e("Database encountered an error: \n" + err);
      });

    });

    // Set our Mongo Session Store object to be used by express.
    app.use(                                                           // Finally, execute our code to configure our connection to the mongodb database.
      express.session({                                                // Enable express sessions.
        secret: config.express.sessionKey,                             // Setup the secret session key.
        store: mongoSessionStore                                       // Setup & connect to the MongoDB database.
      })
    );

  // If we are using PostgreSQL database.
  } else if(config.postgresql.enabled) {                               // If we are configuring a postgresql database.
    return next(new Error("Could not connect to postgresql, one was not configured."), undefined);
  
  // Otherwise, throw an error.
  } else {
    return next(new Error("Could not configure and connect to a database because there were not any enabled."));
  }
}


/**
 * Configure and setup Passport for authentication.
 */
exports.passport = function(app, db, config) {
  var passport = require(config.paths.nodeModulesFolder + 'passport');

  app.use(require(config.paths.nodeModulesFolder + 'connect-flash')());  // Enables flash messages while authenticating with passport.
  app.use(passport.initialize());
  app.use(passport.session());

  log_d("Passport configured successfully.", config);
}

/**
 * Finds and requires all of the routes in the specified order.
 * The different types of routes are specified by a unique identifier
 * followed by the type.  The order is specified by the config.routes
 * array and should be configured in the server.js file.
 */
exports.routes = function (app, db, config, next) {
  var fs    = require('fs'),
      files = {};

  // Require all static folders as public static routes.
  requireStaticFolders(app, config);

  // Intialize the router.
  app.use(app.router);                                                 // Handle all routes
  
  // Set the favicon, if available.
  configureFavIcon(app, config);

  // Setup our view engine and directory.
  configureViews(app, config);

  // Initialize the files object.
  for(var i = 0; i < config.routes.length; i++) {
    files[i] = [];
  }
  

  log_d("Finding all routes in: ", config);
  log_d("\tDirectory: " + config.paths.serverAppFolder, config);
  
  // Walk through all the files in the directory.
  walkAsync(config.paths.serverAppFolder, function(file, next) {
    fs.readFile(file, 'utf8', function(err, data) {

      // Check if the file contains a route tag.
      for(var i = 0; i < config.routes.length; i++) {
        // If it contains a route tag, then add it to the list of files to require.
        if(data.toLowerCase().indexOf(config.routeTypeIdentifier + " " + config.routes[i]) != -1) {
          files[i].push(file);
        }
      }
      next();
    });
  }, function(err, success){
    if(err || ! success) {
      next(err || new Error("There was a problem walking through the routes."));
    }

    // If successful, require all the files in the correct order.
    log_d("Require Routes: ", config);
    for(var key in files) {
      files[key].forEach(function(file) {
        requireFile(file, app, db, config);
      });
    }
    
    next(undefined, true);
  }, config.debugSystem);
}

exports.server = function(app, config) {
  var port = (config.port);                                              // You can set the port using "export PORT=1234" or it will default to your configuration file.
  app.listen(port);                                                  // Start our server listening on previously declared port.
  if(config.mongodb.enabled) {
    console.log("[ OK ] Listening on port ".green + port.cyan + " in ".green + app.settings.env.cyan + " mode with database ".green + config.mongodb.database.cyan + ".".green);
  } else {
    console.log("[ OK ] Listening on port ".green + port.cyan + " in ".green + app.settings.env.cyan + " mode.".green);
  }
}


/* Require File
 * Requires a file with the given relative path.  A relative path
 * begins at the applications server root folder.  In this case that
 * is keys_server.
 */
function requireFile(path, app, db, config) {
  var fs = require('fs');

  // Don't try to load a folder you can't.
  if(path === undefined || path === '') {
    return log_e("Can't require a file with path undefined.");
  }

  // Make sure there is a '/' at the start of the relative path.
  path = (path.substring(0,1) === '/') ? path : '/' + path;
  if(! fs.existsSync(path)) {
    log_e("Can't require a file that doesn't exist.");
    return;
  }
  
  log_d("\tRequire: " + path, config);
  require(path)(app, db, config);
}


var requireStaticFolders = function(app, config) {
  var express = require(config.paths.nodeModulesFolder + "express");

  // If there are static folders in the config file, 
  // then we will configure them as static.
  if(config.paths.staticFolders.length > 0) {
    log_d("Configuring Static Routes: ", config);
  }

  // Require all static folders as public static routes.
  for(var i = 0; i < config.paths.staticFolders.length; i++) {
    log_d("\tFolder: " + config.paths.staticFolders[i], config);
    app.use(express.static(config.paths.staticFolders[i]));
  }
}

var configureViews = function(app, config) {
  log_d("Set Jade as view engine.", config);
  log_d("Set view path as: ", config);
  log_d("\tFolder: " + config.paths.clientAppFolder, config);

  // Set up the root directory for our views.
  //app.set('views', config.paths.clientAppFolder); 
  
  // Set our view engin as JADE.
  //app.set('view engine', 'jade');                         
}

var configureFavIcon = function(app, config) {
  // Set the favicon, if available.
  if(config.paths.favicon !== undefined) {
    log_d("Set favicon:", config);
    log_d("\tFile: " + config.paths.favIcon, config);
    app.use(require(config.paths.nodeModulesFolder + "express").favicon(config.paths.favIcon));     // Display a favicon, use  express.favicon() to use the express default favicon.
  }
}

var log_d = function(string, config) {
  if(config !== undefined && (config.debugSystem || config === true)) {
    if(/\r|\t/.exec(string)) {
      string = string.replace(/\t/g, '          ');  
      console.log(string.white);
    } else {
      string = "[ DEBUG ] " + string;
      console.log(string.magenta);
    }
  } else if(config === undefined) {
    console.log(string);
  }
}

var log_e = function(string) {
  string = "[ ERROR ] " + string;
  console.log(string.red);
}

var log_s = function(string) {
  string = "[ OK ] " + string;
  console.log(string.green);
}

var log_i = function(string) {
  string = "[ INFO ] " + string;
  console.log(string.cyan);
}

var walkAsync = function(directory, action, next, debug) {
  var fs = require('fs');
  
  // Ensure the directory does not have a trailing slash.
  if(directory.substring(directory.length -1) === "/") {
    directory = directory.substring(0, directory.length -1);
  }
  
  // Get a list of all the files and folders in the directory.
  fs.readdir(directory, function(err, list) {
    if(err) {
      return next(err, false);
    }
    
    // Create a count of the number of files and/or folders in the directory.
    var pending = list.length;
    
    // If we are at the end of the list, then return success!
    if( ! pending) {
      return next(null, true);
    }
    
    // For each item in the list, perform an "action" and continue on.
    list.forEach(function(file) {
      
      // Check if the file is invalid; ignore invalid files.
      if(isFileInvalid(file)) {
        log_d("\tSkipping: " + directory + "/" + file, debug);
        pending--;
        return;
      }
      
      // Add a trailing / and file to the directory we are in.
      file = directory + '/' + file;

      // Check if the item is a file or directory.
      fs.stat(file, function(err, stat) {
        if(err) {
          return next(err, false);
        }
        
        // If a directory, add it to our list and continue walking.
        if (stat && stat.isDirectory()) {   
          walkAsync(file, action, function(err, success) {
            if (!--pending) {
              next(null, success);
            }
          }, debug);

        // If a file, perform the action on the file and keep walking.
        } else {  
          action(file, function(err) {
            if(err) {
              next(err, false);
            }

            if (!--pending) {
              next(null, true);
            }
          });
        }
      });
    });
  });
}

var isFileInvalid = function(file) {
  var invalidFiles = ["node_modules"];
  
  if(file.substring(0,1) === ".") {
    return true;
  }

  for(var i = 0; i < invalidFiles.length; i++) {
    if(file.toLowerCase().indexOf(invalidFiles[i]) != -1) {
      return true;
    }
  }

  return false;
}