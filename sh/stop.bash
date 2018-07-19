#!/bin/bash

# Change to parent of this script's directory.
GIT_SITE_ROOT=$(dirname "${BASH_SOURCE[0]}")/..
cd $GIT_SITE_ROOT

PID_FILE=$GIT_SITE_ROOT/run/git.adamheins.com.pid

if [ -f "$PID_FILE" ]; then
  # Kill the process indicated by the PID file and remove it.
  kill -9 $(cat "$PID_FILE")
  rm -f "$PID_FILE"
  echo "Removed PID file."
else
  # If there isn't a PID file, either the process isn't running or something
  # has gone wrong in generating it.
  echo "No PID file found."
fi
