// ~> Library
// ~A Scott Smereka

var isInit = false, log;

/* Get Date Difference
 * Returns the difference between two dates.
 * A Postitive number is a date in the future where negative is in the past.
 */
function getDateDiff(date1, date2) {
  if( ! (date1 instanceof Date) || ! (date2 instanceof Date))
    return undefined
  return (date1.getTime() - date2.getTime());
}

var lib = {  

  diff: function diff(date1, date2) {
    return diff[date1, date2] || (diff[date1, date2] = function(req, res, next) {
      return getDateDiff(date1, date2);
    });
  },

  diffMilliseconds: function diffMilliseconds(date1, date2) {
    return diffMilliseconds[date1, date2] || (diffMilliseconds[date1, date2] = function(req, res, next) {
      return getDateDiff(date1, date2);
    });
  },

  diffSeconds: function diffSeconds(date1, date2) {
    return diffSeconds[date1, date2] || (diffSeconds[date1, date2] = function(req, res, next) {
      return getDateDiff(date1, date2) / 1000;
    });
  },

  diffMinutes: function diffMinutes(date1, date2) {
    return diffMinutes[date1, date2] || (diffMinutes[date1, date2] = function(req, res, next) {
      return getDateDiff(date1, date2) / (1000 * 60);
    });
  },

  diffHours: function diffHours(date1, date2) {
    return diffHours[date1, date2] || (diffHours[date1, date2] = function(req, res, next) {
      return getDateDiff(date1, date2) / (1000 * 60 * 60);
    });
  },

  diffDays: function diffDays(date1, date2) {
    return diffDays[date1, date2] || (diffDays[date1, date2] = function(req, res, next) {
      return getDateDiff(date1, date2) / (1000 * 60 * 60 * 24);
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
    isInit   = true;
    return lib;
  }
}

// Export the library function.
exports = module.exports = init;