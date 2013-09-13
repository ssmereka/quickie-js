// ~> Model

var mongoose    = require('mongoose'),                     // Include object modeling for MongoDB
    Schema      = mongoose.Schema,                         // Mongoose schema object for MongoDB documents.
    ObjectId    = Schema.ObjectId;                         // Object ID used in mongoose schemas

module.exports = function(app, db, config) {

  /* User Role Schema
   * Defines a role with specific permissions for the application.
   */
  var UserRole = new Schema({
    name:  { type: String, required: true, trim: true, unique: true},
    value: { type: Number, required: true, unique: true }
  });

  mongoose.model('UserRole', UserRole);                                             // Set the user role schema.
};