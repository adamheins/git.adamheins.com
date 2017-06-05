#!/bin/bash

# Change to parent of this script's directory.
cd "$(dirname "${BASH_SOURCE[0]}")"/..

PID_FILE=/var/run/git.adamheins.com.pid

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
