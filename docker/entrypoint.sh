#!/bin/bash

echo "Starting OnWApp..."

# Start Painel (Next.js) in background
cd /app/painel
NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0 node server.js &
PAINEL_PID=$!

# Start API (Go) in foreground
cd /app
./onwapp &
API_PID=$!

echo "OnWApp API running on port 3000"
echo "OnWApp Painel running on port 3001"

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
