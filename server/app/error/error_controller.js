// ~> Error

module.exports = function(app, db, config) {
  var sender = require(config.paths.serverLibFolder + "send")(config);
  
  app.all('/*', handleErrors);
  app.all('/*', handle404);

  function handleErrors(err, req, res, next) {
    console.log("Error Handler: ".cyan);
    if(err) {
      return sender.sendError(err, 400, req, res, next);
    } else {
      return next();
    }
  }

  function handle404(req, res, next) {
    console.log("Handle 404: ".cyan);
    return sender.sendError(new Error("Method or Request not found."), 404, req, res, next);
  }

};