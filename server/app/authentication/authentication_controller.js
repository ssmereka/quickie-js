var passport         = require("passport"),                       //Authentication module.
    sanitize         = require('sanitize-it'),
    LocalStrategy    = require('passport-local').Strategy;        //Authentication strategy used by passport for authentication.

module.exports = function(app, db, config) {

  var User             = db.model('User');                        //Pull in the user schema
  var UserRole         = db.model('UserRole');   


  /****************************************/
  /**************** Routes ****************/

  //app.get('/passwordrecovery.:format', showPasswordRecovery);
  
  //app.post('/passwordrecovery/:userId.:format', passwordRecovery);
  
  app.post('/login.:format', passport.authenticate('local', {
    successRedirect: '/dashboard.html',                              // Redirect location.
    failureRedirect: '/login.html',                                  // Redirect back to the login page if there was an error or failure.
    failureFlash: true                                               // Show error messages.
  }));


  /***************************************/
  /********* Passport Strategies *********/

  /* Local Strategy
   * Authenticate user's by username & password.
   */
  passport.use(new LocalStrategy(function(username, password, next) {
    if(sanitize.value(username) === undefined)
        return next(null, false, { message: 'Please enter an email address.' });
    if(sanitize.value(password) === undefined)
        return next(null, false, { message: 'Please enter a password.' });
    User.findOne({email: username}, function(err, user) {
        if(err) {
            next(err, false, { message: 'There was an internal error.  Please try again.' });
        } else if(!user) {                                                            // If the username does not match a user in the database, report an error.
            next(null, false, { message: 'Username or password is invalid.'});
            user.failedLoginAttempt();
        } else if(!user.authenticateSync(password)) {                                 // If the password does not match the found user, report an error.
            next(null, false, { message: 'Username or password is invalid.'});
            user.failedLoginAttempt();        
        } else if(user.activated === false) {                                         // If the user is not activated, report an error.
            next(null, false, { message: user.deactivatedMessage });
        } else {                                                                      // Otherwise, the username and password are valid, let the user login.
            next(null, user);  //TODO: Limit what is shown here, remove password hash and stuff.
            user.successfulLogin();
        }
    });
  }));

  /* Passport Serialize User
   */
  passport.serializeUser(function(user, next) {
    next(null, user._id);
  });

  /* Passport DeserializeUser
   * Defines how passport will get the user from the database.
   */
  passport.deserializeUser(function(id, next) {
    User.findById(id, function(err, user) {
      next(err, user);
    });
  });

};