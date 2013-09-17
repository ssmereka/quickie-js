/**
 * Auth Library
 */

/* ************************************************** *
 * ******************** External Modules
 * ************************************************** */

var allRoles = [], debug, db, log, sender, isInit = false;


/* ************************************************** *
 * ******************** Private Methods
 * ************************************************** */

/**
 * Check to see if the library has been initalized or not.
 */
var checkForInit = function() {
  if(! isInit) {
    console.log("[ ERROR ] You must first initialize auth 'var auth = (\"auth\")(config);' before you use it.");
    return false;
  }
  return true;
}

/**
 * Check for any reasons why the user would be unauthorized or
 * authorized before we start checking roles.
 */
var checkRolePreconditions = function(req, roles, next) {
  // Make sure we initialized the module.  Otherwise deny all users.
  if( ! checkForInit()) {
    log.d("Auth lib was not initialized properly, permission denied for all users.", debug);
    var err = new Error("You do not have permission to perform that action.");
    err.status = 401;
    return next(err);
  }

  // Check if the user is logged in.
  if( ! req.isAuthenticated() ) {
    log.d("User is not logged in, permission denied.", debug);
    var err = new Error("You must be logged in to perform that action.")
    err.status = 401;
    return next(err);
  }

  // Check if we have any roles to enforce, if we don't then as long as the user is logged in, they are authenticated.
  if(roles === undefined) {
    log.w("allowRoles(): Roles was undefined, permission allowed for all logged in users.");
    return next(undefined, allRoles);
  }

  if(roles.indexOf("all") != -1) {
    return next(undefined, allRoles);
  }

  var selfIndex = roles.indexOf("self");
  if( selfIndex != -1) {
    roles.splice(selfIndex, 1);
    if(req && req.params && req.params.userId) {
      if(req.params.userId == req.user._id) {
        log.d("User has been granted permission to perform an action on itself.", debug);
        return next(undefined, allRoles);
      }
    }
  }

  return next(undefined, roles);
}

/**
 * Find the role with the lowest permissions in a list of roles
 * and return that index.
 */
var findLowestRoleIndex = function(roles) {
  var index;
  var lowestRoleIndex = -1;
  for(var i = 0; i < roles.length; i++) {
    index = allRoles.indexOf(roles[i]);

    if(index <= -1) {
      log.w("Role " + roles[i].cyan + " does not exist.");
    } else if(index > lowestRoleIndex) {
      lowestRoleIndex = index;
    }
  }

  return lowestRoleIndex;
}

/**
 * Find the role with the highest permissions in a list of 
 * roles and return that index.
 */
var findHighestRoleIndex = function(roles) {
  var index;
  var highestRoleIndex = allRoles.length;
  for(var i = 0; i < roles.length; i++) {
    index = allRoles.indexOf(roles[i]);

    if(index <= -1) {
      log.w("Role " + roles[i].cyan + " does not exist.");
    } else if(index < highestRoleIndex) {
      highestRoleIndex = index;
    }
  }

  return highestRoleIndex;
}

/* ************************************************** *
 * ******************** Public Exported Methods
 * ************************************************** */

var lib = {

  allowRoles: function allowRoles(roles) {
    return allowRoles[roles] || (allowRoles[roles] = function(req, res, next) {
      checkRolePreconditions(req, roles, function(err, roles) {
        if(err) {
          return next(err, req, res, next);
        }

        // Check if the user has any of the authorized roles.
        for(var i = 0; i < roles.length; i++) {
          if(req.user.roles.indexOf(roles[i]) != -1) {
            return next();
          }
        }

        // If the user does not have any of the authorized roles, then do not allow them any further.
        log.d("Permission denied, user does not contain an allowed role.", debug);
        err = new Error("You do not have permission to perform that action.");
        err.status = 401;
        return next(err, req, res, next);
      });
    });
  },

  allowRolesOrHigher: function allowRolesOrHigher(roles) {
    return allowRolesOrHigher[roles] || (allowRolesOrHigher[roles] = function(req, res, next) {
      checkRolePreconditions(req, roles, function(err, roles) {
        if(err) {
          return next(err, req, res, next);
        }

        // Find the role with the lowest permissions.
        var index = findLowestRoleIndex(roles);

        // Check if the user has the lowest role, or higher.
        for(var i = 0; i <= index; i++) {
          if(req.user.roles.indexOf(allRoles[i]) != -1) {
            return next();
          }
        }

        // If the user does not have any of the authorized roles, then do not allow them any further.
        log.d("Permission denied, user does not contain an allowed role.", debug);
        err = new Error("You do not have permission to perform that action.");
        err.status = 401;
        return next(err, req, res, next)
      });
    });
  },

  allowRolesOrLower: function allowRolesOrLower(roles) {
    return allowRolesOrLower[roles] || (allowRolesOrLower[roles] = function(req, res, next) {
      checkRolePreconditions(req, roles, function(err, roles) {
        if(err) {
          return next(err, req, res, next);
        }

        // Find the role with the highest permissions.
        var index = findHighestRoleIndex(roles);
        
        // Check if the user has the highest role, or lower.
        for(var i = allRoles.length; i >= index; i--) {
          if(req.user.roles.indexOf(allRoles[i]) != -1) {
            return next();
          }
        }

        // If the user does not have any of the authorized roles, then do not allow them any further.
        log.d("Permission denied, user does not contain an allowed role.", debug);
        err = new Error("You do not have permission to perform that action.");
        err.status = 401;
        return next(err, req, res, next)
      });
    });
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

var init = function(_config, _db, next) {
  if(isInit) {
    return lib;
  }

  if(_config !== undefined || _db !== undefined) {
    config = _config;
    debug  = config.systemDebug;
    db     = _db;
    sender = require(_config.paths.serverLibFolder + "send")(config);
    log    = require(config.paths.serverLibFolder + "log")(config);
    initRoleArray(_config, _db, function(err, _allRoles) {
      if(err) {
        next(new Error(err));
      }
      allRoles = _allRoles;
      isInit = true;
      next(undefined, lib);
    });
  } else {
    next(new Error("[ ERROR ] Auth Lib: Config and DB must be defined in order to initialize the auth lib."));
  }
}

var initRoleArray = function(config, db, next) {
  var UserRole = db.model('UserRole');
  var _allRoles = [];

  UserRole.find({}).sort({index: 1}).exec(function(err, roles) {
    if(err) {
      return next(err);
    }

    if(! roles) {
      return next(undefined, _allRoles);
    }

    for(var i = 0; i < roles.length; i++) {
      _allRoles.push(roles[i].name.toLowerCase());
    }
    
    return next(undefined, _allRoles);
  });
}

exports = module.exports = init;
