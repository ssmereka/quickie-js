var path            = require('path'),
    serverDirectory = path.resolve(__dirname + "../../"),
    clientDirectory = path.resolve(__dirname + '../../../client');;

/* ************************************************** *
 * ******************** Server Install Key
 * ************************************************** */

/**
 * Use this key in the access_token field when you try 
 * to io install the server.
 */
var SERVER_INSTALL_KEY = "IOlQ9V6Tg6RVL7DSJFL248723Bm3JjCF34FI0TJOVPvRzz";

/* ************************************************** *
 * ******************** App Information
 * ************************************************** */

var app = {
  name: "quickie",
  domain: "www.quickie.com"
}


/*****************************************/
/********** Email Server Config **********/

var server_email_host          = 'Gmail';
var server_email_address       = 'wopr@livioradio.com';  //'NoReply@livioconnect.com';
var server_email_password      = 'E8496C6BC895B90C8A379AE6DBD438F11BD140093A51E9780234A53B902CDD70';
var server_email_send_from     = 'Livio Connect <NoReply@livioconnect.com>';
var server_email_send_to       = 'sales@livioconnect.com';


/*****************************************/
/********* Config Mode Variables *********/

// Local Mode
var localConfig = {
  host: 'localhost',
  port: '3000',
  protocol: 'http',
  debug: true,

   mongodb: {
     enabled: true,
     useAuthentication: false,
     username: 'admin',
     password: 'ASCO231IYBeEede17dbYsELWtK5UKjNfvN34',
     host: 'localhost',
     port: '27017',
     database: app["name"] + "_local"
   }
}

// Development Mode
var developmentConfig = {
  host: app["domain"],
  port: '3000',
  protocol: 'https',
  debug: true,

  mongodb: {
    enabled: true,
    useAuthentication: true,
    username: 'admin',
    password: 'ASCO231IYBeEede17dbYsELWtK5UKjNfvN34',
    host: 'ds033607.mongolab.com',
    port: '33607',
    database: app["name"] + '_development'
  }
}

// Production Mode
var productionConfig = {
  host: app["domain"],
  port: '3000',
  protocol: 'https',
  debug: false,

  mongodb: {
    enabled: true,
    useAuthentication: true,
    username: 'admin',
    password: 'ASCO231IYBeEede17dbYsELWtK5UKjNfvN34',
    host: 'ds033607.mongolab.com',
    port: '33607',
    database: app["name"] + '_production'
  }
}

/* ************************************************** *
 * *************** Default and System level Configs
 * ************************************************** */

var allConfig = {
  
  /* ************* Overridable Defaults ************* */

  host: 'localhost',
  port: '3000',
  protocol: 'https',
  debug: false,

  title: 'Livio Keys',

  mongodb: {
    enabled: true,
    useAuthentication: true,
    username: 'admin',
    password: 'ASCO231IYBeEede17dbYsELWtK5UKjNfvN34',
    host: 'localhost',
    port: '27017',
    database: app['name'] + '_local'
  },

  /* ************* System Level Configs ************* */
  
  api: {
    currentVersion: 'v1',
    path: '/api'
  },
  express: {                                                   // Express object holds configuration settings for all things express.
    sessionKey: 'CCCQ9V6Tg6RVFfFK5BjBm3JjCFy4FI0TJOD21dk'      // The session key is used to keep the express sessions secure, keep this private.
  },
  debugSystem: false,                                          // Show additional system level debug information.
  dirname: serverDirectory + "/app/",                          // Server application directory.
  installKey: SERVER_INSTALL_KEY,                              // Server install key, a private key used to activate the installation of the server. (Keep it secret, keep it safe)
  paths: {                                                     // The paths object contains information about where different files and folders are located on the disk.
    staticFolders: [                                           // The folders listed in static folders will be required before all other routes as static.
      clientDirectory + '/app/',                               // Client application folder.
      clientDirectory + '/libs/',                              // Client libs folder.
      clientDirectory + '/public/',                            // Client public folder, containing things such as images, css, etc.
    ],
    favIcon: clientDirectory + '/public/img/favicon.ico',      // Fav Icon location.
    clientFolder: clientDirectory,                             // The client root folder.  All things client will be below this folder.
    clientAppFolder: clientDirectory + "/app/",                // Client application folder, which stores all of the core components for the client application.
    serverAppFolder: serverDirectory + "/app/",                // Server application folder, which stores all of the core components for the server application.
    nodeModulesFolder: serverDirectory + "/app/node_modules/", // Folder that holds all of the dependency node modules, installed using npm.
    serverConfigFolder: serverDirectory + "/configs/"          // Server configuration folder, stores all of the server configuration files.
  },
  routes: [],                                                  // Routes array lists the order in which routes will be required.
  routeTypeIdentifier: "~>",                                   // Concatenated with a route type to uniquely identify a file as a specific route type.
  email_host: server_email_host,
  email_address: server_email_address,
  email_password: server_email_password,
  email_send_from: server_email_send_from,
  email_contact_form_sends_to: server_email_send_to
}

/*****************************************/
/************ Config Methods *************/

function createConfigObject(obj1, obj2, env) {
  var obj = mergeObjects(obj1, obj2)

  // Set the port if specified from commandline.
  if(process.env.PORT !== undefined)
    obj[port] = process.env.PORT;

  obj['enviorment'] = env;

  // Set the server's uri
  if(env === 'local')
    obj['host_uri'] = obj['protocol'] + '://' + obj['host'] + ':' + obj['port'];
  else
    obj['host_uri'] = obj['protocol'] + '://' + obj['host'];

  // Set the mongodb uri
  if(obj['mongodb']['enabled'] === true && obj['mongodb']['useAuthentication'] === true)
    obj['mongodb']['uri'] = 'mongodb://' + obj['mongodb']['username']+':'+obj['mongodb']['password']+'@'+obj['mongodb']['host']+':'+obj['mongodb']['port']+'/'+obj['mongodb']['database'];
  else
    obj['mongodb']['uri'] = 'mongodb://' + obj['mongodb']['host']+':'+obj['mongodb']['port']+'/'+obj['mongodb']['database'];

  // Set the server's api uri
  obj['host_api_uri'] = obj['host_uri'] + obj['api']['path'] + '/' + obj['api']['currentVersion'];

  return obj;
}


/* Merge Objects
 * Combine two object's attributes giving priority
 * to the first object's (obj1) attribute values.
 */
function mergeObjects(obj1, obj2) {
  for(var key in obj2) {
    if(obj1[key] === undefined)
      obj1[key] = obj2[key];
  }
  return obj1;
}

var getConfigObject = function() {
  var env = (process.env.NODE_ENV !== undefined) ? process.env.NODE_ENV.toLowerCase() : '';
  switch(env) {
    case 'local':
      return createConfigObject(localConfig, allConfig, env);

    default:
      console.log("Node enviorment mode '" + process.env.NODE_ENV + "' is not recognized, defaulting to production mode.");
    
    case 'development':
      return createConfigObject(developmentConfig, allConfig, env);

    case 'production':
      return createConfigObject(productionConfig, allConfig, env);
  }
}

var configureEnviorment = function(express, app) {
  var env = (process.env.NODE_ENV !== undefined) ? process.env.NODE_ENV.toLowerCase() : '';
  switch(env) {
    case 'local':
      app.disabled('verbose errors');
      app.enable('verbose errors');
      app.use(express.logger('dev'));
      return true;

    default:  // Default to production mode, but alert the user.
    case 'development':
      app.enable('verbose errors');
      app.use(express.logger('dev'));
      return true

    case 'production':
      app.disabled('verbose errors');
      return true
  } 
}

module.exports.config = getConfigObject;
module.exports.configureEnviorment = configureEnviorment;
