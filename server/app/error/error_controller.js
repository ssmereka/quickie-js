// ~> Error

module.exports = function(app, db, config) {
  var sender = require(config.paths.serverLibFolder + "send")(config);
  
  app.all('/*', handleErrors);
  app.all('/*', handle404);

  function handleErrors(err, req, res, next) {
    if(err) {
      return sender.sendError(err, req, res, next);
    } else {
      return next();
    }
  }

  function handle404(req, res, next) {
    return sender.createAndSendError("Method or Request not found.", 404, req, res, next);
  }

};