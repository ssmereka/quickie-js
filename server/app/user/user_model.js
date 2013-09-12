var mongoose    = require('mongoose'),                                              // Include object modeling for MongoDB
    Schema      = mongoose.Schema,                                                  // Mongoose schema object for MongoDB documents.
    ObjectId    = Schema.ObjectId,                                                  // Object ID used in mongoose schemas
    bcrypt      = require('bcrypt'),                                                // Include bcrypt for password hashing.
    saltRounds  = 10,                                                               // Number of rounds used to caclulate a salt for bcrypt password hashing.
    validator   = require('validator'),
    check       = validator.check,
    sanitize    = validator.sanitize,
    crypto      = require('crypto'),
    sanitize    = require('../modules/sanitize'),
    utility     = require('../modules/utility');

module.exports = function(app, db, config) {

  /* User Schema
   * Defines a user in the MongoDB table.
   */
  var User = new Schema({
    activated:          { type: Boolean, default: false },                            // Defines if the user should be allowed to do anything.  For example: login, update their information, etc.
    email:              { type: String, trim: true, lowercase: true, unique: true },  // Email address for the user, must be unique.  This is what the user will login with.
    name:               { type: String, trim: true },                                 // User's name.
    lastUpdated:        { type: Date, default: Date.now },                            // When this user object was last updated.
    lastUpdatedBy:      { type: ObjectId, ref: 'User' },                              // Who was the last person to update this user object.
    passwordHash:       { type: String },                             // A hash generated from the user's password.  Never store a plain text password.
    passwordReset:      { type: String, default: utility.generateHashedKeySync(24) }, // A hash generated to reset a user's password.  This should never be plain text.
    roles:              [{ type: ObjectId, ref: 'UserRole' }],                        // A list of roles the user is a part of.  Roles are used for things like authentication.
    securityQuestion:   { type: String },                                             // Challenge question given to a user when they try to reset their password.
    securityAnswerHash: { type: String, default: utility.generateHashedKeySync(24) }  // User's correct answer to the challenge question when trying to reset their password.  This should never be stored as plain text.
  });

  /********************************************************/
  /**************** User Virtual Attributes ***************/

  /* Get Password
   * Returns the user's password hash.
   */
  User.virtual('password').get(function(){
    return this.securityAnswerHash;
  });

  /* Set Password
   * Generates a hash from the string parameter
   * and sets it as the user's password.
   * Returns true if the password was set successfully.
   */
  User.virtual('password').set(function(password) {
    if(password === undefined || password === null || password === "")
      password = new ObjectId().toString();

    this.password_hash = bcrypt.hashSync(password, saltRounds);             // Synchronous call to create a bcrypt salt & hash, then set that hash as the password.
    this.password_reset = utility.generateKeySync(24);
  });

  /* Get Security Answer
   * Returns the user's security answer hash.
   */
  User.virtual('securityAnswer').get(function(){
    return this.securityAnswerHash;
  });

  /* Set Security Answer
   * Hashes the parameter value and sets it as the user's security
   * answer.  If the parameter is undefined, then a unique answer
   * will be generated and encrypted for you.
   */
  User.virtual('securityAnswer').set(function(answer, next) {
    if(answer === undefined || answer === null || answer === "")
      answer = new ObjectId().toString();

    if(next) {
      bcrypt.hash(answer, saltRounds, function(err, hash) {                         // Generate a salt and hash
        if(err) return next(err);                                                   // Let the next function handle the error.
        
        this.security_answer = hash;                                                // Set the user's password hash
        return next();
      });
    } else {
      this.security_answer = bcrypt.hashSync(answer, saltRounds);                   // Synchronous call to create a bcrypt salt & hash, then set that hash as the password.
      return true;
    }
  });

  /********************************************************/
  /********************* User Methods *********************/

  /* Is Security Answer
   * Checks if the parameter matches the user's stored security answer.
   */
  User.methods.isSecurityAnswer = function(answer, next) {
    if(next)
      return bcrypt.compare(answer, this.securityAnswer, next);                     // Asynchronous call to compare the possible security answer to the encrypted security answer.
    return bcrypt.compareSync(answer, this.securityAnswer);                         // Synchronous call to compare the possible security answer to the encrypted security answer.
  }

  /* Authenticate User
   * Checks if the parameter passed is the user's password and
   * returns true if it is, false otherwise.
   */
  User.methods.authenticate = function(passwordString, next) {
    if(next)
      return bcrypt.compare(passwordString, this.password, next);                   // Asynchronous call to compare the password to the encrypted password.
    return bcrypt.compareSync(passwordString, this.password_hash);                  // Synchronous call to compare the password to the encrypted password.
  };


  User.methods.delete = function(userId, next) {
    var user = this;

    user.remove(function(err, user) {
      if(err && next !== undefined) return next(err, undefined, false);

      if(next !== undefined)
        return next(undefined, user, true);
    });
  }

  /* Update
   * Takes in an object parameter and updates the appropriate user fields.
   */
  User.methods.update = function(obj, userId, next) {
    if( ! obj)
      return next(new Error('Can not update the user object because the parameter is not valid.'));

    var user = this,
        isLastUpdated = false,
        isLastUpdatedBy = false,
        value = undefined;

    for (var key in obj) {
      switch(key) {
        case 'lastUpdatedBy':
          isLastUpdatedBy = true;
        case 'roles':
          value = sanitize.objectId(obj[key]);
          break;

        case 'lastUpdated':
          isLastUpdated = true;
          value = sanitize.date(obj[key]);
          break;

        case 'activated':
          value = sanitize.boolean(obj[key]);
          break;

        case 'password':
          value = sanitize.string(obj[key]);
          if(value !== undefined)
            user.password = value;
          break;

        default:
          value = sanitize.string(obj[key]);
          break;
      }

      if(value !== undefined)
        user[key] = value;
    }

    if( ! isLastUpdated)
      user['lastUpdated'] = Date.now();

    if( ! isLastUpdatedBy)
      user['lastUpdatedBy'] = sanitize.objectId(userId);

    user.save(function(err, user) {
      if(err) return next(err);
      if(!user) return next(new Error('There was a problem saving the updated user object.'));

      return next(undefined, user);
    });
  }


  /********************************************************/
  /********************** User Events *********************/

  User.pre('save', function(next) {
    var user = this;

    if(sanitize.string(user.name) === undefined) {
      return next(new Error('Please enter a valid name.'));
    }

    if(sanitize.string(user.password) === undefined)
      return next(new Error('Please enter a password.'));

    try {
      check(this.email).len(6,64).isEmail();                                        // Check if string is a valid email.
    } catch (e) {
      return next(new Error('Please enter a valid email address.'));
    }

    return next();
  });

  /********************************************************/
  /****************** Export User Schemas *****************/

  mongoose.model('User', User);                                                     // Set the user schema.
};