/*
 */

var sanitize = require('sanitize-it');

exports.send = function(obj, req, res, next) {

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

/**
 * 
 */
var sanitizeApiObject = function(obj, req, res, next) {
  if(! sanitize.isApi(req)) {
    return next(undefined, obj);
  }

  var apiObj = {};
  apiObj["status"] = "OK";
  apiObj["response"] = obj;

  return apiObj;
}