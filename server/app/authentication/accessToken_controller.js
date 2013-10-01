// ~> Controller
// ~A Scott Smereka

module.exports = function(app, db, config) {
  
  /* ************************************************** *
   * ******************** Load Libraries and Models
   * ************************************************** */

  var sender      = require(config.paths.serverLibFolder + "send")(config),
      auth        = require(config.paths.serverLibFolder + "auth")(),
      model       = require(config.paths.serverLibFolder + "model")(),
      AccessToken = db.model('AccessToken'),
      User        = db.model('User');


  /* ************************************************** *
   * ******************** Routes and Permissions
   * ************************************************** */
  
  // Load user roles used for authentication.
  var adminRole = auth.getRoleByName("admin"),
      selfRole  = auth.getRoleByName("self");


  app.get('/accessToken.:format', requestToken);

  app.get('/accessTokens.:format', model.load(AccessToken, {}, { "sort": "creationDate"}), accessTokens);

  // All users with admin role or higher have access to the following
  // methods.  Users also have permission to access their own data in the
  // following methods.
  //app.all('/users/:userId.:format', auth.allowRolesOrHigher([adminRole, selfRole]), model.loadById(User, "userId"));

  // Get a specific access token.   
  app.get('/accessTokens/:tokenId.:format', model.loadById(AccessToken, "tokenId", "user"), accessToken);
  /*app.get('/accessTokens/:tokenId.:format', function(req,res,next) {
    console.log("Finding token");
    AccessToken.findById(req.params.tokenId).populate('user').exec(function(err, token) {
      console.log(err);
      req.queryResult = token;
      next();
    });
  }, accessToken); */

  
  // Update a specific user.
  //app.post('/users/:userId.:format', update);
  
  // Delete a specific user.
  //app.delete('/users/:userId.:format', remove);

  // All user methods after this require a user with an Admin
  // role or higher for access.
  //app.all('/users(/|.)*', auth.allowRolesOrHigher([adminRole]));

  // Get all users information.
  //app.get('/users.:format', model.load(User, {}, {sort: "lastName"}), users);
  
  // Create a new user.
  //app.post('/users.:format', create);


  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

   /**
    * Request a new access token
    */
  function requestToken(req, res, next) {
    var token = new AccessToken();
    User.findOne({}, function(err, user) {
      token.user = user._id;
      token.save(function(err, token) {
        console.log(err);
      });
      sender.send(token, req, res);
    });
  }


  /**
   * Get and return the access token object specified 
   * by its Object ID.
   */
  function accessToken(req, res, next) {
    var token = req.queryResult;                            // Get the access token object queried from the url's tokenId paramter.
    if( ! req.queryResult) return next();                   // If the token object is blank, then the requested token was not found and we cannot handle the request here, so move along.

    sender.send(token.sanitize(), req, res);                // Handles the request by sending back the appropriate response, if we havn't already.
  }

  /**
   * Get all the access tokens and return them in the 
   * requested format.
   */
  function accessTokens(req, res, next) {
    var tokens = req.queryResult;
    if( ! tokens) return next();

    // Sanitize the access token information 
    // before sending it back.
    for(var i = 0; i < tokens.length; i++) {
      tokens[i] = tokens[i].sanitize();
    }

    sender.send(tokens, req, res);                          // Handles the request by sending back the appropriate response, if we havn't already.
  }

  /* Create
   * Create a new user with the attributes specified in the post 
   * body.  Then return that new user object in the specified format.
   */
  function create(req, res, next) {
    var user = new User();
    user.update(req.body, (req.user) ? req.user._id : undefined, function(err, user) {  // Update the new user object with the values from the request body.  Also, if the person creating the new user is identified, send that along in the request.
      if(err) next(err);

      sender.send(user.sanitize(), req, res);                                                     // Handles the request by sending back the appropriate response, if we havn't already.
    });
  }

  /* Update
   * Update an existing user's information with the attributes specified
   * in the post boyd.  Then return that updated user object in the 
   * format specified.
   */
  function update(req, res, next) {
    var user = req.queryResult;                                      // Get the user object queried from the url's userId paramter.
    if( ! req.queryResult) return next();                            // If the user object is blank, then the requested user was not found and we cannot handle the request here, so move along.

    user.update(req.body, (req.user) ? req.user._id : undefined, function(err, user) {  // Update the user object with the values from the request body.  Also, if the person updating the user is identified, send that along in the request.
      sender.send(user.sanitize(), req, res);                        // Handles the request by sending back the appropriate response, if we havn't already.
    });
  }

  /* Remove
   * Delete an existing user from the database along with any 
   * information linked to them.  Then return the deleted user
   * object in the format specified.
   */
  function remove(req, res, next) {
    var user = req.queryResult;                                      // Get the user object queried from the url's userId paramter.
    if( ! req.queryResult) return next();                            // If the user object is blank, then the requested user was not found and we cannot handle the request here, so move along.

    user.delete((req.user) ? req.user._id : undefined, function(err, user, success) {  // Delete the user object and anything linked to it.  Also, if the person deleting the user is identified, send that along in the request.
      if(err) return next(err);

      sender.send(user.sanitize(), req, res);                        // Handles the request by sending back the appropriate response, if we havn't already.   
    });
  }

};