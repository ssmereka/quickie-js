var isInit = false, log, sanitize;


/* Merge Objects
 * Combine two object's attributes giving priority
 * to the first object's (obj1) attribute values.
 */
function mergeObjects(obj1, obj2) {
  for(var key in obj2) {
    if(obj1[key] === undefined)
      obj1[key] = obj2[key];
  }
  return obj1;
}



var lib = {  
  
  loadById: function loadById(Schema, queryObject, populateFields, populateSelects, populateModels, populateConditions) {
    return loadById[Schema, queryObject, populateFields, populateSelects, populateModels, populateConditions] || (loadById[Schema, queryObject, populateFields, populateSelects, populateModels, populateConditions] = function(req, res, next) {
      if(req.params[queryObject]) {
        
        populateFields     = (populateFields)     ? populateFields     : "";
        populateSelects    = (populateSelects)    ? populateSelects    : "";
        populateModels     = (populateModels)     ? populateModels     : "";
        populateConditions = (populateConditions) ? populateConditions : "";

        Schema.findOne(queryObject).populate(populateFields, populateSelects, populateModels, populateConditions).exec(function(err, obj) {
          if(err) {
            next(err);
          } else if( ! obj){
            log.w("Could not find schema object.  Query Object:", debug);
            log.w("\t" + queryObject);
          } else {
            req.queryResult = obj;
          }
          return next();
        });
      } else {
        return next();
      }
    });
  },

  load: function load(Schema, queryObject, opts) {
    return load[Schema, queryObject] || (load[Schema, queryObject] = function(req, res, next) {
      var sort = "";

      queryObject = mergeObjects(req.query, queryObject);

      log.d("Query: " + JSON.stringify(queryObject));

      if(opts) {
        sort = (opts["sort"]) ? opts["sort"] : "";
      }

      Schema.find(queryObject).sort(sort).exec(function(err, obj) {
        if(err) {
          next(err);
        } else if( ! obj){
          log.w("Could not find schema object.  Query Object:", debug);
          log.w("\t" + queryObject);
        } else {
          req.queryResult = obj;
        }
          return next();
      });
    });
  }
}


/* ************************************************** *
 * ******************** Initialization Method
 * ************************************************** */

var init = function() {
  if(isInit) {
    return lib;
  } else {
    log      = require(config.paths.serverLibFolder + "log")(config);
    sanitize = require(config.paths.nodeModulesFolder + "sanitize-it");
    isInit   = true;
    return lib;
  }
}

// Export the library function.
exports = module.exports = init;