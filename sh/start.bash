#!/bin/bash

# Change to parent of this script's directory.
GIT_SITE_ROOT=$(dirname "${BASH_SOURCE[0]}")/..
cd $GIT_SITE_ROOT

PID_FILE=$GIT_SITE_ROOT/run/git.adamheins.com.pid

# Add environment variables required.
while read line; do export "$line";
done < .env

if [ -f "$PID_FILE" ]; then
  # If a PID file exists, that means the process is potentially running, so we
  # do a restart to stop it first.
  echo "PID file found, restarting..."
  npm restart
else
  # No PID file exists, start up the process and generate it.
  nohup node src/server.js >/dev/null 2>&1 &
  echo $! > "$PID_FILE"
fi
