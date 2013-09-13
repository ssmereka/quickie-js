/*
 */

/* ************************************************** *
 * ******************** External Modules
 * ************************************************** */

var sanitize;


/* ************************************************** *
 * ******************** Private Methods
 * ************************************************** */

var sanitizeApiObject = function(obj, req, res, next) {
  if(! sanitize.isApi(req)) {
    return next(undefined, obj);
  }

  var apiObj = {};
  apiObj["status"] = "OK";
  apiObj["response"] = obj;

  return apiObj;
}


/* ************************************************** *
 * ******************** Public Exported Methods
 * ************************************************** */

var lib = {
  
  send: function(obj, req, res, next) {

    // If the request was an API request, then format it as so.
    sanitizeApiObject(obj, req, res, function(err, obj) {
      if(err) {
        if(next !== undefined) {
          return next(err)
        } else {
          return console.log("Send error: " + err);
        }
      }
    });

    if(sanitize.isJson(req))
      return res.send(obj);

    if(sanitize.isText(req))
      return res.type('txt').send(JSON.stringify(obj));

    if(next !== undefined)
      return next();

    // Default to JSON if we can't continue on.
    if(obj !== undefined) {
      return res.send(obj);
    }
  }
}


/* ************************************************** *
 * ******************** Initialization Method
 * ************************************************** */

init = function(config) {
  if(config !== undefined) {
    sanitize = require(config.paths.nodeModulesFolder + 'sanitize-it');  // Include bcrypt for password hashing.
    return lib;
  } else {
    console.log("[ ERROR ] Config initialize send if config is null");
  }
}

module.exports = init;

