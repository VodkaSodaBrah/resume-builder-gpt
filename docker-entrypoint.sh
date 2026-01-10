#!/bin/sh
set -e

# Start Azure Functions in background
cd /app/api
func start --port 7071 &

# Serve frontend with simple Node server
cd /app
npx serve -s dist -l 3000

# Keep container running
wait
