#!/bin/bash

set -e

echo "Starting development servers..."
echo ""

# Run backend in background
echo "Starting backend on port 3001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Run Convex in background
echo "Starting Convex..."
cd client
npx convex dev &
CONVEX_PID=$!
cd ..

# Run frontend in foreground
echo "Starting frontend..."
cd client
vp dev

# When frontend stops, kill background processes
trap "kill $BACKEND_PID 2>/dev/null || true; kill $CONVEX_PID 2>/dev/null || true" EXIT
