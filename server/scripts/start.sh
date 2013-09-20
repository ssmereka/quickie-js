#!/bin/bash

# -------------------------------------------------------- #
# Configure and Start Script
# -------------------------------------------------------- #
# Use this script to start the node server.  It will make 
# sure everything is installed and configured properly.  
# Then it will start the server in the correct mode.
#
#
# Currently designed to work on the following platforms:
#    1. Ubuntu 12.04 LTS
#    2. Mac OSx
# -------------------------------------------------------- #


# -------------------------------------------------------- #
# Configure Script's variables
# -------------------------------------------------------- #


# -------------------------------------------------------- #
# Script Methods & Global Variables
# -------------------------------------------------------- #

debug=false
env="local"
isForceScript=false
useNode=false
useForever=false
useTail=false

# Terminal colors, used to display echo messages.
cyan='\033[0;36m'
green='\033[0;32m'
noColor='\033[0m'
purple='\033[35m'
red='\033[0;31m'
yellow='\033[0;33m'

error () {
  echo -e "${red}[ ERROR ] $@${noColor}"
}

debug () {
  if $debug ; then
    echo -e "${purple}[ DEBUG ] $@${noColor}"
  fi
}

info () {
  echo -e "${cyan}[ INFO ] $@${noColor}"
}

success () {
  echo -e "${green}[ OK ] $@${noColor}"
}

warning () {
  echo -e "${yellow}[ WARNING ] $@${noColor}"
}

exitScript () {
  if ! $isForceScript; then
    exit $1
  fi
}


# -------------------------------------------------------- #
# Command Line User Input
# -------------------------------------------------------- #

# Handle script input from command line.
for var in "$@"
do
  case "$var" in
    
    # Set the node flag
    -n | -node | [node])
      useNode=true
      useForever=false
      ;;

    # Tail the node log file when using forever.
    -t | -tail | [tail])
      useTail=true
      ;;

    # Set the enviorment to local.
    -l | [local] | -local)
      env="local"
      ;;

    # Set the enviorment to development.
    -d | [development] | [dev] | -development | -dev)
      env="development"
      ;;

    # Set the enviorment to production.
    -p | [production] | [pro] | -production | -pro) 
      env="production"
      ;;
    
    # Print the help menu.
    -h | [help] | -help | --help)
      printHelpMenu=true
      ;;

    # Enable debug mode for the script.
    -debug | [debug] | --debug | --d)
      debug=true
      ;;

    # Force the script to run, even if it is recommended not to.
    -f | [force] | -force | --f)
      isForceScript=true
      ;;
    esac
done





# -------------------------------------------------------- #
# - Check Preconditions
# -------------------------------------------------------- #

# Node
# -------------------------------------------------------- #
# Node.JS must be installed to run the server, this will
# check to see if node is installed and what version.

nodeVersion=`node -v 2> /dev/null`                         # Get the node version number
isNodeInstalled=true

if [[ "$nodeVersion" == "" ]]; then                        # If the version number is blank, we know it is not installed.
  isNodeInstalled=false;
fi


if ! $isNodeInstalled ; then
	error "Node.JS is not installed."
  exitScript 1
else
  success "Node.JS is installed."
fi


# -------------------------------------------------------- #
# -------------------- Start
# -------------------------------------------------------- #
cd ../app


# Run the server using node.
NODE_ENV="$env" node server.js





