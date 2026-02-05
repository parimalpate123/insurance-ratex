#!/bin/bash

# InsurRateX - Restart All Services Script
# Usage: ./restart.sh [options]
#
# Options:
#   --build     Force rebuild all containers
#   --logs      Show logs after restart
#   --quick     Quick restart (no rebuild)

set -e  # Exit on error

REBUILD=false
SHOW_LOGS=false
QUICK=false

# Parse arguments
for arg in "$@"
do
    case $arg in
        --build)
            REBUILD=true
            shift
            ;;
        --logs)
            SHOW_LOGS=true
            shift
            ;;
        --quick)
            QUICK=true
            shift
            ;;
        --help)
            echo "InsurRateX - Restart All Services"
            echo ""
            echo "Usage: ./restart.sh [options]"
            echo ""
            echo "Options:"
            echo "  --build     Force rebuild all containers (use after code changes)"
            echo "  --logs      Show logs after restart"
            echo "  --quick     Quick restart without rebuild (fastest)"
            echo "  --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./restart.sh                  # Normal restart"
            echo "  ./restart.sh --build          # Rebuild and restart"
            echo "  ./restart.sh --quick --logs   # Quick restart with logs"
            exit 0
            ;;
    esac
done

echo "🔄 InsurRateX - Restarting Services..."
echo ""

# Stop all containers
echo "⏹️  Stopping containers..."
docker-compose down

echo ""

if [ "$QUICK" = true ]; then
    # Quick restart - just start containers
    echo "⚡ Quick restart (no rebuild)..."
    docker-compose up -d
elif [ "$REBUILD" = true ]; then
    # Full rebuild
    echo "🔨 Rebuilding and starting containers..."
    docker-compose up -d --build
else
    # Normal restart
    echo "▶️  Starting containers..."
    docker-compose up -d
fi

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check container status
echo ""
echo "📊 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep insurratex

echo ""
echo "✅ Services restarted successfully!"
echo ""
echo "🌐 Access Points:"
echo "   • Mapping UI:        http://localhost:8080"
echo "   • Rules UI:          http://localhost:8081"
echo "   • Orchestrator API:  http://localhost:3000"
echo "   • PostgreSQL:        localhost:5432"
echo ""
echo "📚 API Documentation:"
echo "   • Field Catalog:     http://localhost:3000/api/v1/field-catalog"
echo "   • Data Types:        http://localhost:3000/api/v1/data-types"
echo "   • Mappings:          http://localhost:3000/api/v1/mappings"
echo ""

if [ "$SHOW_LOGS" = true ]; then
    echo "📋 Showing logs (Ctrl+C to exit)..."
    echo ""
    docker-compose logs -f
fi
