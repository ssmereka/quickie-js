

/* ************************************************** *
 * ******************** External Modules
 * ************************************************** */

var bcrypt,
    crypto,
    saltRounds = 10;  // Number of rounds used to caclulate a salt for bcrypt password hashing.

/* ************************************************** *
 * ******************** Private Methods
 * ************************************************** */

var checkForInit = function() {
  if(! bcrypt || ! crypto) {
    console.log("[ ERROR ] You must first initialize hash 'var hash = (\"hash\")(config);' before you use it.");
    return false;
  }
  return true;
}

/* ************************************************** *
 * ******************** Public Exported Methods
 * ************************************************** */

var lib = {
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
      console.log("GenerateHashKeySync(" + keyLength + "): Error " + ex);
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
      console.log("GenerateBaseKeySync(" + keyLength + "): Error " + ex);
      return undefined;
    }
  }
}

/* ************************************************** *
 * ******************** Initialization Method
 * ************************************************** */

var init = function(config) {
  if(config !== undefined) {
    bcrypt = require(config.paths.nodeModulesFolder + 'bcrypt');  // Include bcrypt for password hashing.
    crypto = require('crypto');
    return lib;
  } else {
    console.log("[ ERROR ] Config initialize hash if config is null");
  }
}

exports = module.exports = init;