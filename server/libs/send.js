/*
 */

/* ************************************************** *
 * ******************** External Modules
 * ************************************************** */

var sanitize;


/* ************************************************** *
 * ******************** Private Methods
 * ************************************************** */

var sanitizeApiObject = function(err, obj, req, res) {
  if(! sanitize.isApi(req)) {
    return err;
  }

  var apiObj = {};

  if(err) {
    apiObj["status"] = "ERROR";
    apiObj["error"] = err;
    if(obj) {
      apiObj["response"] = obj;
    }
  } else {
    apiObj["status"] = "OK"
    apiObj["response"] = obj;
  }
  return apiObj;
}


/* ************************************************** *
 * ******************** Public Exported Methods
 * ************************************************** */

var lib = {
  
  send: function(obj, req, res, next) {
    // If the request was an API request, then format it as so.
    obj = sanitizeApiObject(undefined, obj, req, res);

    if(sanitize.isJson(req)) {
      return res.send(JSON.stringify(obj));
    }

    if(sanitize.isText(req)) {
      return res.type('txt').send(JSON.stringify(obj));
    }

    if(next !== undefined) {
      return next();
    }

    // Default to JSON if we can't continue on.
    if(obj !== undefined) {
      return res.send(obj);
    }
  },

  sendError: function(err, errorCode, req, res, next) {
    var obj = sanitizeApiObject(err, obj, req, res);

    if(sanitize.isJson(req)) {
      return res.send(obj, errorCode);
    }

    if(sanitize.isText(req)) {
      return res.type('txt').send(JSON.stringify(obj), errorCode);
    }

    if(next !== undefined) {
      return next();
    }

    // Default to JSON if we can't continue on.
    if(obj !== undefined) {
      return res.send(JSON.stringify(obj), errorCode);
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

