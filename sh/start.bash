#!/bin/bash

# Change to parent of this script's directory.
GIT_SITE_ROOT=$(dirname "${BASH_SOURCE[0]}")/..
cd $GIT_SITE_ROOT

PID_FILE=$GIT_SITE_ROOT/run/git.adamheins.com.pid

# Add environment variables required.
while read line; do export "$line";
done < .env

if [ -f "$PID_FILE" ]; then
  echo "PID file found, restarting..."
  npm restart
else
  nohup node src/server.js >/dev/null 2>&1 &
  echo $! > "$PID_FILE"
fi
