#!/bin/sh

# Add environment variables required.
while read line; do export "$line";
done < .env

#nohup nodejs src/server.js >/dev/null 2>&1 &
nodejs src/server.js
