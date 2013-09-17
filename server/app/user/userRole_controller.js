// ~> Controller

module.exports = function(app, db, config) {
  
  var sender   = require(config.paths.serverLibFolder + "send")(config),
      auth     = require(config.paths.serverLibFolder + "auth")(),
      UserRole = db.model('UserRole');                               // Pull in the user role schema.

  /********************************************************/
  /************************ Routes ************************/

  app.get('/userRoles.:format', userRoles);                          // Get all users.
  app.get('/userRoles/:userRole.:format', userRole);                 // Get a specific user.

  app.post('/userRoles.:format', create);                            // Create a new user.
  app.post('/userRoles/:userRole.:format', update);                  // Update an existing user.

  app.delete('/userRoles/:userRole.:format', remove);                // Delete an existing user.


  /********************************************************/
  /******************** Route Functions *******************/

  /* User Role
   * Get and return the user role object specified by their Object ID,
   * name, or index.
   */
  function userRole(req, res, next) {

  }

  /* User Roles
   * Get all the users and return them in the requested format.
   */
  function userRoles(req, res, next) {
    UserRole.find().sort('index').exec(function(err, userRoles) {    // Find all the user roles and sort them by their permission level.
      if(err) return next(err);

      sender.send(userRoles, req, res);                              // Handles the request by sending back the appropriate response.
    });
  }

  /* Create
   * Create a new user role with the attributes specified in the post 
   * body.  Then return that new user role object in the specified format.
   */
  function create(req, res, next) {

  }

  /* Update
   * Update an existing user role's information with the attributes specified
   * in the post body.  Then return that updated user role object in the 
   * format specified.
   */
  function update(req, res, next) {

  }

  /* Remove
   * Delete an existing user role from the database along with any 
   * information linked to them.  Then return the deleted user role
   * object in the format specified.
   */
  function remove(req, res, next) {

  }

};