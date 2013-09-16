

/* ************************************************** *
 * ******************** External Modules
 * ************************************************** */
var isInit = false,
    sender;

/* ************************************************** *
 * ******************** Private Methods
 * ************************************************** */

var checkForInit = function() {
  if(! isInit) {
    console.log("[ ERROR ] You must first initialize auth 'var auth = (\"auth\")(config);' before you use it.");
    return false;
  }
  return true;
}

var isUserLoggedIn = function(req, res, next) {

}

/* ************************************************** *
 * ******************** Public Exported Methods
 * ************************************************** */

var lib = {


  allowRoles: function allowRoles(roles) {
    return allowRoles[roles] || (allowRoles[roles] = function(req, res, next) {
      console.log("Allow Roles: " + roles);
      // Make sure we initialized the module.  Otherwise deny all users.
      if( ! checkForInit()) {
        console.log("Init failed.");
        return next(new Error("You do not have permission to perform that action."), req, res, next);
      }

      // Check if the user is logged in.
      if( ! req.user ) {
        console.log("User not logged in.");
        return next(new Error("You must be logged in to perform that action."), req, res, next);
      }

      // Check if we have any roles to enforce, if we don't then as long as the user is logged in, they are authenticated.
      if(roles === undefined) {
        console.log("[ WARNING ] Roles was undefined in function allowRoles().".yellow)
        return next();
      }

      // Check if the user has any of the authorized roles.
      for(var i = 0; i < roles.length; i++) {
        if(req.user.roles.indexOf(roles[i]) != -1) {
          console.log("User is authenticated.");
          return next();
        }
      }

      console.log("User unauthenticated.");
      // If the user does not have any of the authorized roles, then do not allow them any further.
      return next(new Error("You do not have permission to perform that action."), req, res, next);
    });
  },

  allowRolesOrHigher: function() {
    if( ! checkForInit())
      return;
  },

  allowRolesOrLower: function() {
    if( ! checkForInit())
      return;
  },

  denyRoles: function() {
    if( ! checkForInit())
      return;
  },

  denyRolesOrHigher: function() {
    if( ! checkForInit())
      return;
  },

  denyRolesOrLower: function() {
    if( ! checkForInit())
      return;
  },

  allowAuthTokens: function(tokens) {
    if( ! checkForInit())
      return;
  }
}

/* ************************************************** *
 * ******************** Initialization Method
 * ************************************************** */

var init = function(config) {
  if(config !== undefined) {
    isInit = true;
    sender = require(config.paths.serverLibFolder + "send")(config);
    return lib;
  } else {
    console.log("[ ERROR ] Config initialize auth if config is undefined");
  }
}

exports = module.exports = init;