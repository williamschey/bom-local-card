#!/bin/bash
# Main entry point - works with or without npm
# Usage: ./run.sh [build|test|clean] [docker]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMMAND="${1:-test}"
BUILD_METHOD="${2:-}"

# Build function - handles both npm and Docker
build_card() {
    local method="$1"
    
    # Auto-detect if not specified
    if [ -z "$method" ]; then
        if command -v docker &> /dev/null; then
            method="docker"
        elif command -v npm &> /dev/null; then
            method="npm"
        else
            echo "❌ Error: Neither Docker nor npm found"
            echo "   Please install Docker or Node.js/npm"
            exit 1
        fi
    fi
    
    if [ "$method" = "docker" ]; then
        echo "🐳 Building with Docker..."
        if ! command -v docker &> /dev/null; then
            echo "❌ Error: docker not found"
            exit 1
        fi
        # Pass FORCE_REBUILD if set
        FORCE_REBUILD="${FORCE_REBUILD:-0}" bash scripts/build-docker.sh
    else
        echo "🔨 Building with npm..."
        if ! command -v npm &> /dev/null; then
            echo "❌ Error: npm not found"
            echo "   Install Node.js/npm or use: ./run.sh build docker"
            exit 1
        fi
        
        if [ ! -d "node_modules" ]; then
            echo "📦 Installing dependencies..."
            npm install
        fi
        
        npm run build
    fi
}

# Clean function - full cleanup without sudo
clean_test() {
    echo "🧹 Cleaning test environment..."
    
    # Determine compose files to use
    COMPOSE_FILES="-f docker-compose.test.yml"
    if [ -f "docker-compose.test.local.yml" ]; then
        COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.test.local.yml"
    fi
    
    # Stop and remove containers with volumes
    echo "   Stopping and removing containers..."
    docker compose $COMPOSE_FILES down -v 2>/dev/null || \
    docker-compose $COMPOSE_FILES down -v 2>/dev/null || true
    
    # Remove override file
    rm -f docker-compose.test.local.yml
    
    # Clean up .storage directory using Docker (no sudo needed)
    if [ -d "test-ha/config/.storage" ]; then
        echo "   Removing .storage directory..."
        CURRENT_UID=$(id -u)
        CURRENT_GID=$(id -g)
        if ! rm -rf test-ha/config/.storage 2>/dev/null; then
            # Use Docker to remove root-owned files
            docker run --rm \
                -v "$(pwd)/test-ha/config:/config:rw" \
                -u root \
                alpine:latest \
                sh -c "rm -rf /config/.storage" 2>/dev/null || true
        fi
        echo "   ✅ Cleared .storage directory"
    fi
    
    # Clean up www directory files (card file) using Docker if needed
    if [ -f "test-ha/config/www/bom-local-radar-card.js" ]; then
        echo "   Removing card file..."
        CURRENT_UID=$(id -u)
        CURRENT_GID=$(id -g)
        if ! rm -f test-ha/config/www/bom-local-radar-card.js 2>/dev/null; then
            docker run --rm \
                -v "$(pwd)/test-ha/config/www:/www:rw" \
                -u root \
                alpine:latest \
                sh -c "rm -f /www/bom-local-radar-card.js" 2>/dev/null || true
        fi
    fi
    
    # Optionally clean build artifacts
    if [ "${CLEAN_BUILD:-0}" = "1" ]; then
        echo "   Removing build artifacts..."
        rm -rf dist/ node_modules/ 2>/dev/null || true
    fi
    
    echo ""
    echo "✅ Cleanup complete. Run './run.sh test' to start fresh."
}

# Update function - rebuilds card and updates running test environment
update_card() {
    local method="$1"
    
    echo "🔄 Rebuilding and updating card in running test environment..."
    
    # Always force rebuild when updating to ensure changes are picked up
    if [ -z "$method" ]; then
        if command -v docker &> /dev/null; then
            method="docker"
        elif command -v npm &> /dev/null; then
            method="npm"
        fi
    fi
    
    # Force rebuild
    if [ "$method" = "docker" ]; then
        FORCE_REBUILD=1 bash scripts/build-docker.sh
    else
        npm run build
    fi
    
    # Update card in running environment (test.sh auto-detects running containers)
    ./scripts/test.sh
}

case "$COMMAND" in
    build)
        build_card "$BUILD_METHOD"
        ;;
    test)
        ./scripts/test.sh
        ;;
    update)
        update_card "$BUILD_METHOD"
        ;;
    clean)
        clean_test
        ;;
    *)
        echo "Usage: ./run.sh [COMMAND] [BUILD_METHOD]"
        echo ""
        echo "Commands:"
        echo "  build [docker|npm]  - Build the card (auto-detects method if not specified)"
        echo "  test                - Build and start test Home Assistant environment"
        echo "  update [docker|npm] - Rebuild card and update running test environment"
        echo "                        (preserves HA state, auto-detects if containers running)"
        echo "  clean               - Clean test environment (stops containers, removes data)"
        echo ""
        echo "Build Methods:"
        echo "  docker              - Use Docker to build (isolated, no local Node.js needed)"
        echo "  npm                 - Use local npm/Node.js to build"
        echo ""
        echo "Examples:"
        echo "  ./run.sh build          # Auto-detect: Docker (preferred) or npm"
        echo "  ./run.sh build docker   # Force Docker build"
        echo "  ./run.sh test           # Build and start test environment"
        echo "  ./run.sh update         # Rebuild and update running environment"
        echo "  ./run.sh clean          # Clean test environment"
        echo ""
        echo "Note: For more options (e.g., --service-path), use ./scripts/test.sh directly"
        exit 1
        ;;
esac

