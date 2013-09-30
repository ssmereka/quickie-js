

/* ************************************************** *
 * ******************** External Modules
 * ************************************************** */

var bcrypt,
    crypto,
    log,
    saltRounds = 10;  // Number of rounds used to caclulate a salt for bcrypt password hashing.

/* ************************************************** *
 * ******************** Private Methods
 * ************************************************** */

var checkForInit = function() {
  if(! bcrypt || ! crypto) {
    log.e("You must first initialize hash 'var hash = (\"hash\")(config);' before you use it.");
    return false;
  }
  return true;
}

/* ************************************************** *
 * ******************** Public Exported Methods
 * ************************************************** */

var lib = {
  hashKey: function(key, _saltRounds, next) {
    if( ! checkForInit)
      return;

    _saltRounds = (_saltRounds === undefined || _saltRounds < 0) ? saltRounds : _saltRounds;

    bcrypt.hash(key, saltRounds, function(err, hash) {
      if(err) return next(err);

      return next(null, hash);
    });
  },

  hashKeySync: function(key, _saltRounds) {
    if( ! checkForInit())
      return;

    _saltRounds = (_saltRounds === undefined || _saltRounds < 0) ? saltRounds : _saltRounds;

    try {
      return bcrypt.hashSync(key, _saltRounds);
    } catch(ex) {
      log.e("HashKeySync(" + key + "): Error " + ex.toString());
      return undefined;
    }
  },

  generateHashedKey: function(keyLength, next) {
    if( ! checkForInit())
      return;

    generateKey(keyLength, function(err, key) {
      if(key === undefined || key === null || key === "")
        return next(new Error('Key generation failed.'));

      bcrypt.hash(key, saltRounds, function(err, hash) {       // Generate a salt and hash
        if(err) return next(err);                              // Let the next function handle the error.
        
        return next(null, hash);                               // Set the user's password hash
      });
    });
  },

  generateHashedKeySync: function(keyLength) {
    if( ! checkForInit())
      return;

    try {
      return bcrypt.hashSync(this.generateKeySync(keyLength).toLowerCase(), saltRounds);
    } catch(ex) {
      log.e("GenerateHashKeySync(" + keyLength + "): Error " + ex.toString());
      return undefined;
    }
  },

  generateKey: function(keyLength, next) {
    if( ! checkForInit())
      return;

    crypto.randomBytes(keyLength, function(ex, buf) {
      next(null, buf.toString('hex').toLowerCase());
    });
  },

  generateKeySync: function(keyLength) {
    if( ! checkForInit())
      return;

    try {
      return crypto.randomBytes(keyLength).toString('hex').toLowerCase();
    } catch(ex) {
      log.e("GenerateBaseKeySync(" + keyLength + "): Error " + ex.toString());
      return undefined;
    }
  }
}

/* ************************************************** *
 * ******************** Initialization Method
 * ************************************************** */

var init = function(config) {
  // Initialize items that do not require parameters.
  log = require(config.paths.serverLibFolder + "log")();

  if(config !== undefined) {
    bcrypt = require(config.paths.nodeModulesFolder + 'bcrypt');  // Include bcrypt for password hashing.
    crypto = require('crypto');
    return lib;
  } else {
    log.e("Config initialize hash if config is undefined");
  }
}

exports = module.exports = init;