/* Loading Module
 */

exports.app = function() {
  var colors = require("../app/node_modules/colors");
  return module.exports = require("../app/node_modules/express")(); 
}

exports.config = function(app) {
  // Load the config file.  The config file holds all our applicaiton's settings.
  var configModule = require('../configs/config');
  if(configModule === undefined) {
    return log_e("Could not load config file.");
  }

  // Load the config object.
  var config = configModule.config();
  if(config === undefined) {
    return log_e("Could not load config module.");
  }

  // Handle different operating modes set by using "export NODE_ENV=local" or "export NODE_ENV=development" or etc.
  var success = configModule.configureEnviorment(require("../app/node_modules/express"), app, config);
  if(! success) {
    
    log_e("[ ERROR ] Could not load config enviorment".red);
    return undefined;
  } else {
    
    log_d("Debug mode activated", config);
    log_d("Loaded config module successfully.", config);
    return config;
  }
}

exports.express = function(app) {
  var express = require('../app/node_modules/express'); 
  app.use(express.cookieParser());                                       // Setup express: enable cookies.
  app.use(express.bodyParser());                                         // Setup express: enable body parsing.
  app.use(require('../app/node_modules/express-validator'));
}

exports.database = function(app, config, next) {
  // Notify the user we are waiting for the database conneciton.
  log_i("Connecting to database...");

  if(config.mongodb.enabled) {                                         // If we are configuring a Mongo database.
    var express = require('../app/node_modules/express'), 
        mongoose = require('../app/node_modules/mongoose'),
        MongoStore = require('../app/node_modules/connect-mongo')(express);

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

    app.use(                                                           // Finally, execute our code to configure our connection to the mongodb database.
      express.session({                                                // Enable express sessions.
        secret: config.express.sessionKey,                             // Setup the secret session key.
        store: mongoSessionStore                                       // Setup & connect to the MongoDB database.
      })
    );
  } else if(config.postgresql.enabled) {                               // If we are configuring a postgresql database.
    log_e("Could not connect to postgresql, one was not configured.");
    return next(undefined, undefined);
  } else {
    log_e("Could not configure and connect to a database because there were not any enabled.");
  }
}

exports.passport = function(app, db, config) {
  var passport = require('../app/node_modules/passport');

  app.use(require('../app/node_modules/connect-flash')());  // Enables flash messages while authenticating with passport.
  app.use(passport.initialize());
  app.use(passport.session());

  log_d("Passport configured successfully.", config);
}

exports.routes = function (app, db, config, next) {
  var identifier = "<quickie-file-type>",
      fs         = require('fs'),
      files      = {};

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
  walkAsync(config.paths.serverAppFolder, function(err, file, next) {
    fs.readFile(file, 'utf8', function(err, data) {
      if(err) {
        log_e("Walk Async encountered a problem: \n\n + " + err + "\n\n");
      }

      // Check if the file contains a route tag.
      for(var i = 0; i < config.routes.length; i++) {
        // If it contains a route tag, then add it to the list of files to require.
        if(data.toLowerCase().indexOf(identifier + config.routes[i]) != -1) {
          files[i].push(file);
        }
      }

      next();
    });
  }, function(err, success){
    // If successful, require all the files in the correct order.
    log_d("Require Routes: ", config);
    if(success) {
      for(var key in files) {
        files[key].forEach(function(file) {
          requireFile(file, app, db, config);
        });
      }
      next(undefined, true);
    }
  });
}

exports.server = function(app, config) {
  console.log("Start server");
  var port = (config.port);                                              // You can set the port using "export PORT=1234" or it will default to your configuration file.
  app.listen(port);                                                  // Start our server listening on previously declared port.
  if(config.mongodb.enabled) {
    console.log("Listening on port %d in %s mode with database %s.", port, app.settings.env, config.mongodb.database);
  } else {
    console.log("Listening on port %d in %s mode.", port, app.settings.env);
  }
}



/* Setup Database
 * Configure the database you setup in the config file.
 * It will return the connected database object
 *
 * TODO: Find a way to continue on even if the database
 *       fails to connect.
 */
function setupDatabase(app, config, next){

}

/* Require Files
 * Given a root level directory and a file type, this funciton will loop through
 * and require all files of the specified type.  Currently the only folder it will 
 * look into is /core.  Example: If type is model, then it will search for all files
 * in /core and /core's subdirectories with "_model" in their name and require them.
 */
exports.requireFiles = function(type, app, db, config, next) {
  type = (type === undefined || type === null) ? undefined : '_' + type.toLowerCase();

  walker.walk(config.dirname + "/core", function(err, file) {
    if(file !== undefined && file !== null) {       // Don't try to load invalid files
      if(type !== undefined && file.toLowerCase().indexOf(type) != -1) {  // If we are loading by file type, Don't load files that are not of the choosen type.
        require(file)(app, db, config);
      }
    }
  }, function(err, success) {
    if(err) {
      console.log(err);
      if(next !== undefined)
        next(err);
    } else if ( ! success) {
      err = new Error("There was a problem requiring files of type " + type);
      console.log(err);
      if(next !== undefined) 
        next(err);
    } else {
      if(next !== undefined)
        next(undefined, true);
    }
  });     
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
  var express = require("../app/node_modules/express");

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
  app.set('views', config.paths.clientAppFolder); 
  
  // Set our view engin as JADE.
  app.set('view engine', 'jade');                         
}

var configureFavIcon = function(app, config) {
  // Set the favicon, if available.
  if(config.paths.favicon !== undefined) {
    log_d("Set favicon:", config);
    log_d("\tFile: " + config.paths.favIcon, config);
    app.use(require("../app/node_modules/express").favicon(config.paths.favIcon));     // Display a favicon, use  express.favicon() to use the express default favicon.
  }
}

var log_d = function(string, config) {
  if(config !== undefined && config.debug) {
    
    if(/\r|\t/.exec(string)) {
      string = string.replace(/\t/g, '          ');  
      console.log(string.white);
    } else {
      string = "[ DEBUG ] " + string;
      console.log(string.magenta);
    }
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


var walkAsync = function(directory, action, next) {
  
  // Ensure the directory does not have a trailing slash.
  if(directory.substring(directory.length -1) === "/") {
    directory = directory.substring(0, directory.length -1);
  }

  var fs = require('fs');
  
  fs.readdir(directory, function(err, list) {
    if(err) {
     return next(err);
    }
    
    var pending = list.length;
    if( ! pending) {
      return next(null, true);
    }
    
    list.forEach(function(file) {
      
      if(isFileInvalid(file)) {
        log_d("\tSkipping: " + directory + "/" + file, { debug: true});
        pending--;
        return;
      }
      
      file = directory + '/' + file;

      fs.stat(file, function(err, stat) {
        // If a directory
        if (stat && stat.isDirectory()) {   
          walkAsync(file, action, function(err, success) {
            if (!--pending) {
              next(null, success);
            }
          });

        } else {  // If file.
          action(err, file, function() {
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

exports.walk = walkAsync;