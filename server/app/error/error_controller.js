// ~> Error

module.exports = function(app, db, config) {

  app.all('/*', handleErrors);

  function handleErrors(req, res, next) {
  	if(req.errorMessages && req.errorMessages.length > 0)
  		res.send(req.errorMessages);
  }

};