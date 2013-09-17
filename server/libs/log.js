var isInit = false,   // Determines if we need to reinitalize the module.
    config;           // Server configuration object.

/***
 * Colors Module
 * Possible Colors: yellow, cyan, white, magenta, green, red, grey, blue, rainbow, zebra, random.
 * Possible Styles: bold, italic, underline, inverse.
 */
var colors;

/**
 * Checks the display log variable and determines
 * whether or not to show the log.
 */
var isDisplayLog = function(displayLog) {
  // If the user didn't specify a display log variable, or
  // if the display log variable is true, then return true.
  if(displayLog === undefined || displayLog) {
    return true;
  }
  return false;
}

/**
 * Special characters and tags are added to the
 * log string based on the type of log.
 */
var formatLog = function(string, tag) {
  if(/\r|\t/.exec(string)) {
    return string.replace(/\t/g, '          ');
  } else if(tag) {
    return "[ " + tag + " ] " + string;
  } else {
    return string;
  }
}


/**
 * This is the public library object that is returned when 
 * the module is required.
 */
var lib = {

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
   * Debug (Magenta): Display addtional information only if the app is in debug mode.
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
   * Info (Cyan): Display general information about an action or event.
   */
  i: function(string, displayLog) {
    if(! isDisplayLog(displayLog)) {
      return;
    }

    console.log(formatLog(string, "INFO").cyan);
  },
  
  /**
   * Success (Green): Display a success message to the user.
   */
  s: function(string, displayLog) {
    if(! isDisplayLog(displayLog)) {
      return;
    }

    console.log(formatLog(string, "OK").green);
  },

  /**
   * Warning (Yellow): Warn the user about an action or event.
   */
  w: function(string, displayLog) {
    if(! isDisplayLog(displayLog)) {
      return;
    }

    console.log(formatLog(string, "WARNING").yellow);
  },

  /**
   * Error (Red): Display an error to the user.
   */
  e: function(string, err, displayLog) {
    if(! isDisplayLog(displayLog)) {
      return;
    }

    if(string !== undefined) { 
      console.log(formatLog(string, "ERROR").red);
    }

    if(err !== undefined) {
      console.log(err.red);
    }
  },

  /**
   * Log (Default): Display a message using the default console settings.
   */
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
  // Check to see if the file has been initalized, we don't need to re-initalize it.
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

// Export the initalization function.
exports = module.exports = init;
