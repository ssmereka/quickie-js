// ~> Controller

var colors = require("colors");

module.exports = function(app, db, config) {
  
  var ObjectId = db.Types.ObjectId,
      User     = db.model('User'),
      UserRole = db.model('UserRole');

  /********************************************************/
  /************************ Routes ************************/

  app.get('/install.:format', install);


  /********************************************************/
  /******************** Route Functions *******************/

  function install(req, res, next) {
    loadDatabaseSchema(config, "userRoles", undefined);
    loadDatabaseSchema(config, "user", undefined);
    next();
  }


  /********************************************************/
  /******************** Private Methods *******************/

  function loadDatabaseSchema(config, schema, next) {
    var info = "";
    switch(schema) {
      case 'userRoles':
        clearSchemaObjects("userroles");
        addToSchema(new UserRole({ _id: ObjectId("51a8dd107deeb3910a000000"), name: 'Admin', value: 0 }));
        addToSchema(new UserRole({ _id: ObjectId("51a8dd107deeb3910a000001"), name: 'User',  value: 1 }));
        info = "Loaded user roles to the database".white;
        break;

      case 'user':
        clearSchemaObjects("users");
        var user = new User({ 
          activated: true,
          email: "admin@localhost.com",
          firstName: "Admin",
          password: config.installKey,
          securityAnswer: config.installKey,
          roles: [ ObjectId("51a8dd107deeb3910a000000") ], 
          security_question: 'What is the install key?' });

        addToSchema(user, undefined);
        info = "Loaded user ".white + "admin@".cyan + config.host.cyan + " with the ".white + "install key".cyan + " as the password.".white;
        break;
    }
    
    if(next != undefined)
      return next(undefined, info);

    console.log(info);
  }


  function clearSchemaObjects(schema) {
    if(schema !== undefined && db.connection.collections[schema] !== undefined) {
      db.connection.collections[schema].drop();
    }
  };

  function addToSchema(schemaObj, next) {
    schemaObj.save(function(err, newSchemaObj) {
      if(err) {
        console.log(err);
        if(next !== undefined)
          return next(err);
      }

      if(next !== undefined)
        next(newSchemaObj);
    });
  }

};