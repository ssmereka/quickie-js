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

        Schema.findById(req.params[queryObject]).populate(populateFields, populateSelects, populateModels, populateConditions).exec(function(err, obj) {
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

  /**
   *
   * Parameters:
   *   obj -
   *   currentObject - 
   *   userId -
   *   next -
   */
  update: function update(obj, currentObject, userId, isUpdated, next) {
    return update[obj, currentObject, userId, isUpdated, next] || (update[obj, currentObject, userId, isUpdated, next] = function() {
      var now   = Date.now,
          value = undefined;

      // Check if any changes were made to the object.
      // If there were not, then return, we are done here.
      if( ! isUpdated) {
        if(next !== undefined) {
          return next(undefined, true);
        }
        return true;
      }

      // check for a valid update object.
      if( ! obj) {
        var err = new Error('Cannot update the schema object because the first parameter "obj" is not valid.')
        err.status = 500;

        // If a callback was supplied, then pass the error on.
        if(next !== undefined) {
          return next(err);
        }
        
        // Otherwise just print the error.
        return log.e(err);
      }

      // Update the last updated by attribute with the parameter object's
      // information or the userId parameter.  If neither is present, then
      // set the value to undefined because we don't know who updated it last.
      value = sanitize.objectId(obj['lastUpdatedBy']);
      currentObject['lastUpdatedBy'] = (value) ? value : sanitize.objectId(userId);
      
      // Update the last updated date and time with the parameter object's
      // informaiton or the time this function was called.
      value = sanitize.objectId(obj['lastUpdated']);
      currentObject['lastUpdated'] = (value) ? value : now;
      
      currentObject.save(function(err, currentObject) {
        // If the current object was not returned,
        // and there was no error, then create a generic error.
        if(! user && ! err) {
          var err = new Error('There was a problem saving the updated user object.');
          err.status = 500;
        }

        // If there were any errors, then return them or log them.
        if(err) {
          if(next !== undefined) {
            return next(err);
          }
          return log.e(err);
        }

        // Upon success, call the next function if we can.
        if(next !== undefined) {
          next(undefined, currentObject);
        }
      });
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

var init = function(config) {
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