// ~> Controller

var colors = require("colors");

module.exports = function(app, db, config) {
  
  var ObjectId = db.Types.ObjectId,
      User     = db.model('User'),
      UserRole = db.model('UserRole'),
      sender   = require(config.paths.serverLibFolder + "send")(),
      log      = require(config.paths.serverLibFolder + "log")();

  /********************************************************/
  /************************ Routes ************************/

  app.get('/install.:format', install);


  /********************************************************/
  /******************** Route Functions *******************/

  function install(req, res, next) {
    loadDatabaseSchema(config, "userRoles", undefined);
    loadDatabaseSchema(config, "user", undefined);
    return sender.send(true, req, res, next);
    next();
  }


  /********************************************************/
  /******************** Private Methods *******************/

  function loadDatabaseSchema(config, schema, next) {
    var info = "";
    switch(schema) {
      case 'userRoles':
        clearSchemaObjects("userroles");
        addToSchema(new UserRole({ name: 'super admin', index: 0 }));
        addToSchema(new UserRole({ name: 'admin',       index: 1 }));
        addToSchema(new UserRole({ name: 'moderator',   index: 2 }));
        addToSchema(new UserRole({ name: 'user',        index: 3 }));
        addToSchema(new UserRole({ name: 'guest',       index: 4 }));
        if(next === undefined)
          log.i("Loaded user roles to the database".white);
        break;

      case 'user':
        clearSchemaObjects("users");
        var users = createUserObjects(config);

        for(var i = 0; i < users.length; i++) {
          addToSchema(users[i], undefined);
          if(next === undefined) {
            log.i("Loaded user ".white + users[i].email.cyan + " with the ".white + "install key".cyan + " as the password.".white);
          }
        }
        break;
    }
    
    if(next != undefined)
      return next(undefined, true);
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

  function createUserObjects(config) {
    users = [];
    
    // Super Admin
    users.push(new User({ 
      activated: true,
      email: "superadmin@localhost.com",
      firstName: "Super Admin",
      password: config.installKey,
      securityAnswer: config.installKey,
      roles: [ "super admin" ], 
      security_question: 'What is the install key?' }));
    
    if(config.debugSystem) {
      // Admin
      users.push(new User({ 
        activated: true,
        email: "admin@localhost.com",
        firstName: "Admin",
        password: config.installKey,
        securityAnswer: config.installKey,
        roles: [ "admin" ], 
        security_question: 'What is the install key?' }));

      // Moderator
      users.push(new User({ 
        activated: true,
        email: "moderator@localhost.com",
        firstName: "Moderator",
        password: config.installKey,
        securityAnswer: config.installKey,
        roles: [ "moderator" ], 
        security_question: 'What is the install key?' }));

      // User
      users.push(new User({ 
        activated: true,
        email: "user@localhost.com",
        firstName: "User",
        password: config.installKey,
        securityAnswer: config.installKey,
        roles: [ "user" ], 
        security_question: 'What is the install key?' }));

      // Guest
      users.push(new User({ 
        activated: true,
        email: "guest@localhost.com",
        firstName: "Guest",
        password: config.installKey,
        securityAnswer: config.installKey,
        roles: [ "guest" ], 
        security_question: 'What is the install key?' }));
    }

    return users;
  };

};