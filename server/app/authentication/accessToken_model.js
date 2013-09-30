// ~> Model
// ~A Scott Smereka

var mongoose    = require('mongoose'),                        // Include object modeling for MongoDB
    Schema      = mongoose.Schema,                            // Mongoose schema object for MongoDB documents.
    ObjectId    = Schema.ObjectId,                            // Object ID used in mongoose schemas
    saltRounds  = 10,                                         // Number of rounds used for hashing.
    tokenLife   = 10,                                         // Number of days a token is valid for.
    sanitize    = require('sanitize-it');                     // Module to sanitize user input.

module.exports = function(app, db, config) {

  /* ************************************************** *
   * ******************** Load Libraries
   * ************************************************** */

  var date  = require(config.paths.serverLibFolder + 'date')(config),   // Working with dates in javascript.
      hash  = require(config.paths.serverLibFolder + 'hash')(config),   // Hashing and token generation.
      log   = require(config.paths.serverLibFolder + "log")(),          // Logging to console.
      model = require(config.paths.serverLibFolder + "model")(config);  // Helper methods for schema models.


  /* ************************************************** *
   * ******************** Schema Default Methods
   * ************************************************** */

  /**
   * Set the default expiration date for an access
   * token schema object.
   */
  var setExpDate = function() {
    var now = new Date();
    return now.setDate(now.getDate() + tokenLife);
  }

  /* ************************************************** *
   * ******************** Access Token Schema
   * ************************************************** */

  /**
   * Defines an access token used to authenticate an
   * application.
   */
  var AccessToken = new Schema({
    activated:      { type: Boolean, default: false },            // When true, allows access token to authenticate on behalf of the user.
    creationDate:   { type: Date, default: Date.now },            // Date and time the token was created.
    expirationDate: { type: Date, default: setExpDate },          // Date and time the token will expire.
    lastUpdated:    { type: Date, default: Date.now },            // When this object was last updated by a user.
    lastUpdatedBy:  { type: ObjectId, ref: 'User' },              // Who last updated this object.
    maxUsage:       { type: Number, default: -1 },                // Maximum number of times the access token can be used.
    tokenHash:      { type: String, unique: true },               // The token's calculated hash used to authenticate a user's access token.
    usage:          { type: Number, default: 0 },                 // Number of times the api token has been used.
    user:           { type: ObjectId, ref: 'User', unique: true } // User the token is linked to.
  });


  /* ************************************************** *
   * ******************** Virtual Attributes
   * ************************************************** */

  /**
   * Returns the access token hash.
   */
  AccessToken.virtual('token').get(function() {
    return this.tokenHash;
  });

  /**
   * Sets the the access token to the string parameter value.
   * If an invalid parameter value is specified (such as undefined)
   * then a new token will be generated and set.
   * The token will be returned if the function was successful, 
   * otherwise undefined will be returned.
   */
  AccessToken.virtual('token').set(function(token) {
    if(sanitize.string(token) === undefined)
      token = hash.generateKeySync(24);
    
    this.tokenHash = hash.hashKeySync(token, saltRounds);        // Synchronous call to create a bcrypt salt & hash, then set that hash as the password.
    return token;
  });


  /* ************************************************** *
   * ******************** Access Token Methods
   * ************************************************** */

  /**
   * Checks if the access token is valid and returns true
   * or false.  This can be used synchronously or 
   * asynchronously by passing in a next parameter.
   */
  AccessToken.methods.authenticate = function(token, next) {
    var now = new Date();

    // Check for a valid possible token
    if(sanitize.string(token) === undefined) {
      return false;
    }

    // Creation date must be prior to right now.
    if(date.diff(now, this.creationDate) < 0) {
      return false;
    }

    // Expiration date must be later than now.
    if(date.diff(this.expirationDate, now) <= 0) {
      return false;
    }

    // Usage must be less than our max usage.
    if(this.usage >= this.maxUsage) {
      return false;
    }

    // Check if the token matches our token hash.
    if(next)
      return bcrypt.compare(token, this.tokenHash, next);     // Asynchronous call to compare the possible access token to the encrypted access token.
    return bcrypt.compareSync(token, this.tokenHash);         // Synchronous call to compare the possible access token to the encrypted access token.
  }

  /**
   * Checks if the token parameter matches the stored 
   * access token.  Returns true if it matches and
   * false otherwise.
   */
  AccessToken.methods.isToken = function(token, next) {
    if(next)
      return bcrypt.compare(token, this.tokenHash, next);     // Asynchronous call to compare the possible access token to the encrypted access token.
    return bcrypt.compareSync(token, this.tokenHash);         // Synchronous call to compare the possible access token to the encrypted access token.
  }

  /**
   * Generate a new access token and clear all tracking 
   * stats for the old access token.
   */
  AccessToken.methods.refreshToken = function(token, next) {
    var now = new Date();
    this.token = token;
    this.creationDate = now;
    this.expirationDate = now.setDate(now.getDate() + tokenLife); 
    this.usage = 0;
    if(next) {
      this.save(next);
    } else {
      this.save(function(err, token) {
        if(err) log.e(err);
        if(! token) log.e(new Error("There was a problem saving the refreshed token"));
      });
    }
  }

  /**
   * Handle tracking a successful login using an access token.
   */
  AccessToken.methods.successfulLogin = function(next) {
    var obj = {};
    obj["usage"] = this.usage + 1;
    this.update(obj, undefined, next);
  }

  /**
   * Remove the access token object from the database.
   */
  AccessToken.methods.delete = function(next) {
    var token = this;

    token.remove(function(err, token) {
      if(err && next !== undefined) return next(err, undefined, false);

      if(next !== undefined)
        return next(undefined, token, true);
    });
  }

  /**
   * Strip out secret information that should not be seen
   * outside of this server.  This should be called before
   * returning an access token object to a client.
   */
  AccessToken.methods.sanitize = function() {
    var User = db.model('User');
    var token = this;
    token = token.toObject();

    // Sanitize any possibly populated objects
    token.user = (sanitize.objectId(token.user)) ? token.user : new User(token.user).sanitize();

    delete token.tokenHash;
    delete token.__v;
    return token;
  }

  /**
   * Takes in an object parameter and updates the appropriate user fields.
   */
  AccessToken.methods.update = function(obj, userId, next) {
    var accessToken = this,
        isUpdated   = false;

    // Loop through each property in the new object.  
    // Verify each property and update the user object accordingly.
    for (var key in obj) {
      switch(key) {
        
        // Number Property Types
        case 'maxUsage':
        case 'usage':
          value = sanitize.number(obj[key]);
          break;

        // Object ID Property Types
        case 'user':
          value = sanitize.objectId(obj[key]);
          break;

        // Date Property Types
        case 'creationDate':
        case 'expirationDate':
          value = sanitize.date(obj[key]);
          break;

        // Boolean Property Types  
        case 'activated':
          value = sanitize.boolean(obj[key]);
          break;

        // Ignore these, the model update function will 
        // handle them for us.
        case 'lastUpdated':
        case 'lastUpdatedBy':
          break;

        // String Property Types, handled by default.
        default:
          value = sanitize.string(obj[key]);
          break;
      }

      // If the value was valid, then update the access token object.
      if(value !== undefined) {
        accessToken[key] = value;
        isUpdated = true 
      }
    }

    // Handle the lastUpdated and lastUpdatedBy attributes
    // then save the object.
    model.update(obj, accessToken, userId, isUpdated, next);
  }


  /* ************************************************** *
   * ******************** Access Token Events
   * ************************************************** */

  /**
   * Executed before saving the object, checks to make sure
   * the schema object is valid.
   * Note:  This is executed after the schema model checks.
   */
  AccessToken.pre('save', function(next) {
    var accessToken = this;

    // If there isn't an access token already generated,
    // then create one.
    // TODO:  See if this is necessary.
    if(sanitize.string(accessToken.token) === undefined) {
      accessToken.token = undefined;
    }

    return next();
  });


  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  mongoose.model('AccessToken', AccessToken);

};
