// ~> Controller

module.exports = function(app, db, config) {
  
  var sender = require(config.paths.serverLibFolder + "send")(config),
      auth   = require(config.paths.serverLibFolder + "auth")(),
      User   = db.model('User');                                     // Pull in the user schema

/* ************************************************** *
 * ******************** Routes and Permissions
 * ************************************************** */

  var adminRole = auth.getRoleByName("admin"),
      superAdminRole = auth.getRoleByName("superadmin"),
      selfRole  = auth.getRoleByName("self"),
      guestRole = auth.getRoleByName("guest"),
      allRole   = auth.getRoleByName("all");


  // All users with admin role or higher have access to the following
  // methods.  Users also have permission to access their own data in the
  // following methods.
  app.all('/users/:userId.:format', auth.allowRolesOrHigher([adminRole, selfRole]));

  // Get a specific user.   
  app.get('/users/:userId.:format', user);
  
  // Update a specific user.
  app.post('/users/:userId.:format', update);
  
  // Delete a specific user.
  app.delete('/users/:userId.:format', remove);


  // All user methods after this require a user with an Admin
  // role or higher for access.
 // app.all('/users(/|.)*', auth.allowRolesOrHigher([admin]));
  app.all('/users(/|.)*', auth.allowRolesOrHigher([adminRole]));

  // Get all users information.
  app.get('/users.:format', users);
  
  // Create a new user.
  app.post('/users.:format', create);


/* ************************************************** *
 * ******************** Route Methods
 * ************************************************** */

  /* User
   * Get and return the user object specified by their Object ID.
   */
  function user(req, res, next) {
    var user = req.queryResult;                                      // Get the user object queried from the url's userId paramter.
    if( ! req.queryResult) return next();                            // If the user object is blank, then the requested user was not found and we cannot handle the request here, so move along.

    sender.send(user.sanitize(), req, res);                          // Handles the request by sending back the appropriate response, if we havn't already.
  }

  /* Users
   * Get all the users and return them in the requested format.
   */
  function users(req, res, next) {
    User.find().sort('name').exec(function(err, users) {             // Find all the users and sort them by their name attribute.
      if(err) return next(err);

      // Sanitize the users information before sending it back.
      for(var i = 0; i < users.length; i++) {
        users[i] = users[i].sanitize();
      }

      sender.send(users, req, res);                                  // Handles the request by sending back the appropriate response, if we havn't already.
    });
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