#!/bin/bash

# ComfyUI Mini Startup Script
# Loads configuration from .env file and starts the server

# Check if .env file exists
if [ -f .env ]; then
    echo "Loading configuration from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Warning: .env file not found. Using default settings."
fi

# Set default values if not provided in .env
HOST=${HOST:-"localhost"}
PORT=${PORT:-1811}
DEBUG=${DEBUG:-false}
DEBUG_CONNECTION=${DEBUG_CONNECTION:-false}
DEBUG_CONFIG=${DEBUG_CONFIG:-false}
FORCE_BUILD=${FORCE_BUILD:-false}
BUILD_PATH=${BUILD_PATH:-"./build"}

# Build command arguments
ARGS=""

# Add host argument
if [ "$HOST" != "localhost" ]; then
    ARGS="$ARGS --host $HOST"
fi

# Add port argument
if [ "$PORT" != "1811" ]; then
    ARGS="$ARGS --port $PORT"
fi

# Add debug flags
if [ "$DEBUG" = "true" ]; then
    ARGS="$ARGS --debug"
fi

if [ "$DEBUG_CONNECTION" = "true" ]; then
    ARGS="$ARGS --debug-connection"
fi

if [ "$DEBUG_CONFIG" = "true" ]; then
    ARGS="$ARGS --debug-config"
fi

# Add build options
if [ "$FORCE_BUILD" = "true" ]; then
    ARGS="$ARGS --force-build"
fi

if [ "$BUILD_PATH" != "./build" ]; then
    ARGS="$ARGS --build-path $BUILD_PATH"
fi

# Display configuration
echo "Starting ComfyUI Mini with configuration:"
echo "  Host: $HOST"
echo "  Port: $PORT"
echo "  Debug: $DEBUG"
echo "  Debug Connection: $DEBUG_CONNECTION"
echo "  Debug Config: $DEBUG_CONFIG"
echo "  Force Build: $FORCE_BUILD"
echo "  Build Path: $BUILD_PATH"
echo ""

# Change to server directory and start
cd server

echo "Command: bun run index.ts$ARGS"
echo "Starting server..."
echo ""

exec bun run index.ts$ARGS