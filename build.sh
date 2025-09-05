#!/bin/bash

# ComfyUIMini Enhanced Build Script with Automatic Versioning
# This script handles the complete build process and updates version information

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CLIENT_DIR="client"
SERVER_DIR="server" 
VERSION_FILE="VERSION"
CLIENT_VERSION_FILE="$CLIENT_DIR/src/version.ts"
SERVER_VERSION_FILE="$SERVER_DIR/src/version.ts"

# Function to print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to generate version number
generate_version() {
    local version_type="${1:-patch}"  # major, minor, patch (default)
    
    if [ ! -f "$VERSION_FILE" ]; then
        echo "1.0.0" > "$VERSION_FILE"
        print_info "Created initial version file: 1.0.0"
    fi
    
    local current_version=$(cat "$VERSION_FILE")
    local major=$(echo "$current_version" | cut -d. -f1)
    local minor=$(echo "$current_version" | cut -d. -f2) 
    local patch=$(echo "$current_version" | cut -d. -f3)
    
    case "$version_type" in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch"|*)
            patch=$((patch + 1))
            ;;
    esac
    
    local new_version="$major.$minor.$patch"
    echo "$new_version" > "$VERSION_FILE"
    echo "$new_version"
}

# Function to update version files
update_version_files() {
    local version="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local git_commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    local build_number=$(date +%s)
    
    print_info "Updating version files to $version..."
    
    # Update client version file
    cat > "$CLIENT_VERSION_FILE" << EOF
// Auto-generated version file - DO NOT EDIT MANUALLY
// Updated on build: $timestamp

export const version = {
  number: '$version',
  timestamp: '$timestamp',
  commit: '$git_commit',
  buildNumber: $build_number,
  fullVersion: '$version+$git_commit'
};

export default version;
EOF

    # Update server version file
    cat > "$SERVER_VERSION_FILE" << EOF
// Auto-generated version file - DO NOT EDIT MANUALLY  
// Updated on build: $timestamp

export const version = {
  number: '$version',
  timestamp: '$timestamp',
  commit: '$git_commit', 
  buildNumber: $build_number,
  fullVersion: '$version+$git_commit'
};

export default version;
EOF

    print_success "Version files updated to $version"
}

# Function to build client
build_client() {
    print_info "Building client..."
    
    if [ ! -d "$CLIENT_DIR" ]; then
        print_error "Client directory not found: $CLIENT_DIR"
        exit 1
    fi
    
    cd "$CLIENT_DIR"
    
    # Install dependencies
    print_info "Installing client dependencies..."
    bun install
    
    # Build client
    print_info "Building Vue application..."
    bun --bunx vite build
    
    cd ..
    print_success "Client build completed"
}

# Function to build server
build_server() {
    print_info "Building server..."
    
    if [ ! -d "$SERVER_DIR" ]; then
        print_error "Server directory not found: $SERVER_DIR"
        exit 1
    fi
    
    cd "$SERVER_DIR"
    
    # Install dependencies
    print_info "Installing server dependencies..."
    bun install
    
    # Type check
    print_info "Running TypeScript type check..."
    bun run typecheck
    
    cd ..
    print_success "Server build completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --version-type TYPE   Version bump type: major, minor, patch (default: patch)"
    echo "  --no-build           Update version only, skip build process"
    echo "  --client-only        Build client only"
    echo "  --server-only        Build server only"
    echo "  --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                   # Build with patch version bump"
    echo "  $0 --version-type minor  # Build with minor version bump"
    echo "  $0 --no-build        # Update version files only"
    echo "  $0 --client-only     # Build client only"
}

# Parse command line arguments
VERSION_TYPE="patch"
NO_BUILD=false
CLIENT_ONLY=false
SERVER_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --version-type)
            VERSION_TYPE="$2"
            shift 2
            ;;
        --no-build)
            NO_BUILD=true
            shift
            ;;
        --client-only)
            CLIENT_ONLY=true
            shift
            ;;
        --server-only)
            SERVER_ONLY=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main build process
main() {
    print_info "=== ComfyUIMini Enhanced Build Process ==="
    print_info "Starting build at $(date)"
    
    # Generate new version
    local new_version=$(generate_version "$VERSION_TYPE")
    print_success "Version: $new_version ($VERSION_TYPE bump)"
    
    # Update version files
    update_version_files "$new_version"
    
    if [ "$NO_BUILD" = true ]; then
        print_info "Skipping build process (--no-build flag)"
        exit 0
    fi
    
    # Build based on options
    if [ "$CLIENT_ONLY" = true ]; then
        build_client
    elif [ "$SERVER_ONLY" = true ]; then
        build_server
    else
        # Build both client and server
        build_client
        build_server
    fi
    
    print_success "=== Build completed successfully! ==="
    print_info "Version: $new_version"
    print_info "Build finished at $(date)"
}

# Run main function
main "$@"