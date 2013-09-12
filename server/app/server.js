var load = require("../libs/loading");

load.app(function(err, app, config, db) {
  if(err) { 
    return console.log(err.red);
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
