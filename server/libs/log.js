var isInit = false,
    config,
    colors;

var isDisplayLog = function(displayLog) {
  if(displayLog === undefined || displayLog) {
    return true;
  }
  return false;
}

var formatLog = function(string, tag) {
  if(/\r|\t/.exec(string)) {
    return string.replace(/\t/g, '          ');
  } else {
    return "[ " + tag + " ] ";
  }
}

lib: {

  /**
   * Verbose (White): Display logs that are descriptive.
   */
  v: function(string, displayLog) {
    if(! isDisplayLog(displayLog)) {
      return;
    }

    console.log(string.white);
  },

  /**
   * Debug (Magenta): Display addtional information if the app is in debug mode.
   */
  d: function(string, displayLog) {
    if(! isDisplayLog(displayLog)) {
      return;
    }

    if(! config.debug) {
      return;
    }

    console.log(formatLog(string, "DEBUG").magenta);
  },
  
  /**
   * Info (Green):
   */
  i: function(string, displayLog) {
    if(! isDisplayLog(displayLog)) {
      return;
    }

    console.log(formatLog(string, "INFO").green);
  },

  /**
   * Warning (Orange):
   */
  w: function(string, displayLog) {
    if(! isDisplayLog(displayLog)) {
      return;
    }

    console.log(formatLog(string, "WARNING").yellow);
  },

  /**
   * Error (Red):
   */
  e: function(string, displayLog) {
    if(! isDisplayLog(displayLog)) {
      return;
    }

    console.log(formatLog(string, "ERROR").red);
  },

  log: function(string, displayLog) {
    if(! isDisplayLog(displayLog)) {
      return;
    }

    console.log(string);
  }
};

/**
 * Initialize the Log library function.
 * This can be called multiple times, however only the first time will
 * require the config object.
 */
var init = function(_config) {
  // Check to see if the file has been initalized, we don't need to re initalize it.
  if(isInit) {
    return lib;
  }

  if(_config !== undefined) {
    config = _config;
    colors = require(_config.paths.nodeModulesFolder + "colors"),
    isInit = true;
    return lib;
  } else {
    console.log("[ ERROR ] Log Library could not be initalized with an undefined config object.");
  }
}

exports = module.exports = init;
