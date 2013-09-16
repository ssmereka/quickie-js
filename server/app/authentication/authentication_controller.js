// ~> Controller

/**
 * Authentication Controller
 * Handles all routes related to authentication.
 * For example:  Login, logout, password recovery, etc.
 */

/* ************************************************** *
 * ******************** Load Modules
 * ************************************************** */
var passport         = require("passport"),                       // Used for authentication
    sanitize         = require('sanitize-it'),                    // Used to sanitize data into something predictable.  For example a value of 'null' or 'undefined' both equal undefined.
    LocalStrategy    = require('passport-local').Strategy;        // Authentication strategy of username and password used by passport module.

module.exports = function(app, db, config) {

  /* ************************************************** *
   * ******************** Load libraries and Models
   * ************************************************** */

  var sender   = require(config.paths.serverLibFolder + "send")(config),
      User     = db.model('User'),
      UserRole = db.model('UserRole');   


  /* ************************************************** *
   * ******************** Define Routes
   * ************************************************** */

  app.get('/authStatus.:format', isLoggedIn);

  app.post('/login.:format', login);
  app.post('/logout.:format', logout);


  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

  /**
   * Log a user out and terminate their session.
   */
  function logout(req, res, next) {
    if(! req.isAuthenticated()) {
      return sender.sendError(new Error("User is already logged out."), 400, req, res, next);
    }
    req.logout();
    return sender.send("OK", req, res, next);
  }

  /**
   * Login a user and create their session, or throw an error if login
   * was unsuccessful.
   */
  function login(req, res, next) {
    // Check if the user is already logged in.
    if(req.isAuthenticated()) {
      return sender.sendError(new Error("User is already logged in."), 400, req, res, next);
    }

    // If the user is not logged in, authenticate them using the local (username and password) authentication strategy.
    passport.authenticate('local', function(err, user, user_error) {
      if(err) {
        return next(err);
      } 

      // If authentication was not successful, send the info back in the response.
      if ( ! user || user_error) {
        return sender.sendError(user_error, 401, req, res, next);
      }

      // If authentication was successful, log in the user and notify the requester.
      req.logIn(user, function(err) {
        if(err) {
          return next(err);
        }
        
        return sender.send("OK", req, res, next);
      });
    })(req, res, next);
  }

  /**
   * Returns if a user is logged in or not.
   */
  function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
      return sender.send(true, req, res, next);
    } else {
      return sender.send(false, req, res, next);
    }
  }

  /* ************************************************** *
   * ******************** Passport Methods
   * ************************************************** */

  var serializeUser = function(user, next) {
    return next(null, user._id);
  }

  /**
   * Get a user, by ID, from the database and return it to passport.
   */
  var deserializeUser = function(userId, next) {
    User.findById(userId, function(err, user) {
      next(err, user);
    });
  }

  /**
   * Authenticate a user by username and password.  Returns the authenticated
   * user or an error.  Also handles any logic around logging in a user.
   */
  var usernameAndPasswordAuth = function (username, password, next) {
    if(sanitize.value(username) === undefined) {
        console.log("Username cant be null");
        return next(null, false, new Error('Please enter an email address.' ));
    }
    
    if(sanitize.value(password) === undefined) {
        console.log("Password can't be null")
        return next(null, false, new Error('Please enter a password.' ));
    }

    User.findOne({email: username}, function(err, user) {
        if(err) {
          next(err, false, err.message);
        } else if(!user) {                                                            // If the username does not match a user in the database, report an error.
            next(null, false, new Error('Username or password is invalid.'));
            user.failedLoginAttempt();
        } else if(!user.authenticate(password)) {                                 // If the password does not match the found user, report an error.
            next(null, false, new Error('Username or password is invalid.'));
            user.failedLoginAttempt();        
        } else if(user.activated === false) {                                         // If the user is not activated, report an error.
            next(null, false, user.deactivatedMessage );
        } else {                                                                      // Otherwise, the username and password are valid, let the user login.
            console.log("Login Successful");
            next(null, user);  //TODO: Limit what is shown here, remove password hash and stuff.
            user.successfulLogin();
        }
    });
  }

  /* ************************************************** *
   * ******************** Passport Configuration
   * ************************************************** */
  
  /* Local Strategy
   * Configures passport to authenticate a user by username & password.
   */
  passport.use(new LocalStrategy(usernameAndPasswordAuth));

  /* Passport Serialize User
   */
  passport.serializeUser(serializeUser);

  /* Passport DeserializeUser
   * Defines how passport will get the user from the database.
   */
  passport.deserializeUser(deserializeUser);

};