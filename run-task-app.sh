#!/bin/bash

# Store the script's directory path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $1 is already in use"
        exit 1
    fi
}

# Check if required ports are available
check_port 3000  # Frontend port
check_port 8081  # Backend port

# Function to kill processes on script exit
cleanup() {
    echo "Shutting down servers..."
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Set up cleanup on script termination
trap cleanup EXIT INT TERM

# Start the backend server
echo "Starting backend server..."
cd "$SCRIPT_DIR"
./mvnw spring-boot:run &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
while ! nc -z localhost 8081; do
    sleep 1
done

# Start the frontend server
echo "Starting frontend server..."
cd "$SCRIPT_DIR/frontend"
npm start &
FRONTEND_PID=$!

# Keep script running and show logs
echo "Both servers are running!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8081"
echo "Press Ctrl+C to stop both servers"

# Wait for either process to exit
wait $FRONTEND_PID $BACKEND_PID 