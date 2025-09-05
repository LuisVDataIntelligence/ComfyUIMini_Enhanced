#!/bin/bash

# ComfyUIMini Enhanced - Run Script
# Usage: ./run.sh [command] [options]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ComfyUIMini Enhanced"
SERVER_DIR="server"
CLIENT_DIR="client"
PID_FILE="./.comfyui-mini.pid"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    if ! command -v bun &> /dev/null; then
        log_error "Bun is not installed. Please install Bun first: https://bun.sh"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Using default configuration."
    fi
}

load_env() {
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
        log_info "Environment variables loaded from .env"
    fi
}

check_comfyui() {
    local comfyui_url="${COMFYUI_URL:-http://localhost:8188}"
    log_info "Checking ComfyUI connection at $comfyui_url..."
    
    if curl -s --max-time 5 "$comfyui_url/api/object_info" > /dev/null 2>&1; then
        log_success "ComfyUI is running and accessible"
        return 0
    else
        log_error "ComfyUI is not accessible at $comfyui_url"
        log_info "Please ensure ComfyUI is running or update COMFYUI_URL in .env"
        return 1
    fi
}

start_server() {
    check_requirements
    load_env
    
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log_warning "$PROJECT_NAME is already running (PID: $pid)"
            return 0
        else
            rm -f "$PID_FILE"
        fi
    fi
    
    log_info "Starting $PROJECT_NAME..."
    
    # Build client if needed
    if [ "$FORCE_BUILD" = "true" ] || [ ! -d "$SERVER_DIR/build" ]; then
        log_info "Building client..."
        cd "$CLIENT_DIR"
        bun install
        bun run build
        cd ..
    fi
    
    # Start server
    cd "$SERVER_DIR"
    bun install
    
    # Determine server command based on environment
    local server_cmd="bun run index.ts"
    local host="${HOST:-localhost}"
    local port="${PORT:-1811}"
    
    if [ "$DEBUG" = "true" ]; then
        server_cmd="$server_cmd --debug"
    fi
    
    if [ "$DEBUG_CONNECTION" = "true" ]; then
        server_cmd="$server_cmd --debug-connection"
    fi
    
    if [ "$DEBUG_CONFIG" = "true" ]; then
        server_cmd="$server_cmd --debug-config"
    fi
    
    if [ "$host" != "localhost" ]; then
        server_cmd="$server_cmd --host $host"
    fi
    
    if [ "$port" != "1811" ]; then
        server_cmd="$server_cmd --port $port"
    fi
    
    log_info "Server command: $server_cmd"
    log_info "Starting server on $host:$port"
    
    # Start server in background and save PID
    nohup $server_cmd > ../logs/server.log 2>&1 &
    echo $! > "../$PID_FILE"
    
    cd ..
    
    # Wait a moment and check if server started successfully
    sleep 2
    local pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
        log_success "$PROJECT_NAME started successfully (PID: $pid)"
        log_info "Access the interface at: http://$host:$port"
        log_info "Server logs: logs/server.log"
    else
        log_error "Failed to start $PROJECT_NAME"
        rm -f "$PID_FILE"
        exit 1
    fi
}

stop_server() {
    if [ ! -f "$PID_FILE" ]; then
        log_warning "$PROJECT_NAME is not running"
        return 0
    fi
    
    local pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
        log_info "Stopping $PROJECT_NAME (PID: $pid)..."
        kill "$pid"
        
        # Wait for process to stop
        local count=0
        while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        if kill -0 "$pid" 2>/dev/null; then
            log_warning "Process didn't stop gracefully, forcing..."
            kill -9 "$pid"
        fi
        
        rm -f "$PID_FILE"
        log_success "$PROJECT_NAME stopped successfully"
    else
        log_warning "Process not found, cleaning up PID file"
        rm -f "$PID_FILE"
    fi
}

restart_server() {
    log_info "Restarting $PROJECT_NAME..."
    stop_server
    sleep 1
    start_server
}

show_status() {
    load_env
    local host="${HOST:-localhost}"
    local port="${PORT:-1811}"
    local comfyui_url="${COMFYUI_URL:-http://localhost:8188}"
    
    echo "=== $PROJECT_NAME Status ==="
    
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log_success "Server: Running (PID: $pid)"
            echo "  URL: http://$host:$port"
        else
            log_error "Server: Not running (stale PID file)"
        fi
    else
        log_error "Server: Not running"
    fi
    
    # Check ComfyUI status
    if curl -s --max-time 3 "$comfyui_url/api/object_info" > /dev/null 2>&1; then
        log_success "ComfyUI: Connected ($comfyui_url)"
    else
        log_error "ComfyUI: Not accessible ($comfyui_url)"
    fi
    
    # Show configuration
    echo ""
    echo "=== Configuration ==="
    echo "Host: $host"
    echo "Port: $port"
    echo "HTTPS: ${HTTPS_ENABLED:-false}"
    if [ "${HTTPS_ENABLED}" = "true" ]; then
        echo "Certificate: ${HTTPS_CERT:-./certs/cert.pem}"
        echo "Private Key: ${HTTPS_KEY:-./certs/key.pem}"
    fi
    echo "ComfyUI URL: $comfyui_url"
    echo "Debug: ${DEBUG:-false}"
    echo "Debug Connection: ${DEBUG_CONNECTION:-false}"
    echo "Debug Config: ${DEBUG_CONFIG:-false}"
}

show_logs() {
    if [ ! -f "logs/server.log" ]; then
        log_error "No log file found at logs/server.log"
        return 1
    fi
    
    echo "=== Server Logs ==="
    tail -f "logs/server.log"
}

dev_mode() {
    check_requirements
    load_env
    
    log_info "Starting $PROJECT_NAME in development mode..."
    
    # Set debug environment
    export DEBUG=true
    export DEBUG_CONNECTION=true
    export DEBUG_CONFIG=true
    
    # Build client in watch mode (background)
    log_info "Starting client development server..."
    cd "$CLIENT_DIR"
    bun install
    bun dev &
    local client_pid=$!
    
    # Start server in development mode
    cd "../$SERVER_DIR"
    bun install
    
    log_info "Starting server in development mode..."
    log_info "Client dev server: http://localhost:5173"
    log_info "Server API: http://localhost:${PORT:-1811}"
    
    # Trap to cleanup on exit
    trap "kill $client_pid 2>/dev/null" EXIT
    
    bun run index.ts --debug --debug-connection --debug-config
}

generate_certs() {
    log_info "Generating development certificates..."
    
    # Check if openssl is available
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL is not installed. Please install OpenSSL to generate certificates."
        log_info "On Ubuntu/Debian: sudo apt install openssl"
        log_info "On macOS: brew install openssl"
        exit 1
    fi
    
    # Create certs directory
    mkdir -p certs
    
    # Generate self-signed certificate
    log_info "Creating self-signed certificate for development..."
    openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -sha256 -days 365 -nodes \
        -subj "/C=US/ST=Dev/L=Development/O=ComfyUIMini/OU=Development/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:0.0.0.0"
    
    if [ -f "certs/cert.pem" ] && [ -f "certs/key.pem" ]; then
        log_success "Development certificates generated successfully!"
        log_info "Certificate: certs/cert.pem"
        log_info "Private key: certs/key.pem"
        log_info "Valid for 365 days"
        log_warning "These are self-signed certificates for development only!"
        log_info "To enable HTTPS, set HTTPS_ENABLED=true in your .env file"
    else
        log_error "Failed to generate certificates"
        exit 1
    fi
}

enable_https() {
    load_env
    
    log_info "Enabling HTTPS..."
    
    # Check if certificates exist
    if [ ! -f "certs/cert.pem" ] || [ ! -f "certs/key.pem" ]; then
        log_warning "Certificates not found. Generating them first..."
        generate_certs
    fi
    
    # Update .env file
    if grep -q "HTTPS_ENABLED=" ".env"; then
        sed -i 's/HTTPS_ENABLED=.*/HTTPS_ENABLED=true/' .env
    else
        echo "HTTPS_ENABLED=true" >> .env
    fi
    
    log_success "HTTPS enabled! Restart the server to apply changes."
}

disable_https() {
    log_info "Disabling HTTPS..."
    
    # Update .env file
    if grep -q "HTTPS_ENABLED=" ".env"; then
        sed -i 's/HTTPS_ENABLED=.*/HTTPS_ENABLED=false/' .env
    else
        echo "HTTPS_ENABLED=false" >> .env
    fi
    
    log_success "HTTPS disabled! Restart the server to apply changes."
}

setup_project() {
    log_info "Setting up $PROJECT_NAME..."
    
    # Create logs directory
    mkdir -p logs
    
    # Install dependencies
    log_info "Installing root dependencies..."
    bun install
    
    log_info "Installing client dependencies..."
    cd "$CLIENT_DIR"
    bun install
    
    log_info "Installing server dependencies..."
    cd "../$SERVER_DIR"
    bun install
    
    cd ..
    
    # Build client
    log_info "Building client..."
    cd "$CLIENT_DIR"
    bun run build
    cd ..
    
    log_success "Setup completed successfully!"
}

show_help() {
    echo "Usage: ./run.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  start         Start the server"
    echo "  stop          Stop the server"
    echo "  restart       Restart the server"
    echo "  status        Show server and ComfyUI status"
    echo "  logs          Show and follow server logs"
    echo "  dev           Start in development mode"
    echo "  setup         Set up project dependencies and build"
    echo "  generate-certs Generate HTTPS development certificates"
    echo "  enable-https  Enable HTTPS and generate certificates if needed"
    echo "  disable-https Disable HTTPS"
    echo "  help          Show this help message"
    echo ""
    echo "Environment variables (set in .env file):"
    echo "  HOST              Server host (default: localhost)"
    echo "  PORT              Server port (default: 1811)"
    echo "  COMFYUI_URL       ComfyUI URL (default: http://localhost:8188)"
    echo "  HTTPS_ENABLED     Enable HTTPS (default: false)"
    echo "  HTTPS_CERT        Path to certificate file (default: ./certs/cert.pem)"
    echo "  HTTPS_KEY         Path to private key file (default: ./certs/key.pem)"
    echo "  DEBUG             Enable debug mode (default: false)"
    echo "  DEBUG_CONNECTION  Enable connection debugging (default: false)"
    echo "  DEBUG_CONFIG      Enable config debugging (default: false)"
    echo "  FORCE_BUILD       Force rebuild of client (default: false)"
}

# Main command handling
case "${1:-help}" in
    "start")
        start_server
        ;;
    "stop")
        stop_server
        ;;
    "restart")
        restart_server
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "dev")
        dev_mode
        ;;
    "setup")
        setup_project
        ;;
    "generate-certs")
        generate_certs
        ;;
    "enable-https")
        enable_https
        ;;
    "disable-https")
        disable_https
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac