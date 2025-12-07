#!/bin/sh

# Start backend server in background
cd /app/backend && node server.js &

# Start frontend static server
serve -s /app/frontend/dist -l 5173
