var load   = require("../libs/loading"),
    app    = load.app(),
    config = load.config(app);

load.express(app);

load.database(app, config, function(err, db) {
  if(err || ! db) { 
    return next(err || "[ ERROR ] Unknown database error.".red); 
  }
  
  load.passport(app, db, config);

  // Configure order of your routes.
  config.routes.push("model")
  config.routes.push("controller");
  config.routes.push("error");
  
  load.routes(app, db, config, function(err, success) {
    load.server(app, config);
  });

});
