#!/bin/bash

# InsurRateX - Restart All Services
# This script restarts the complete platform (useful after code changes)

set -e

echo "🔄 Restarting InsurRateX Platform"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
BUILD=false
CLEAN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --build|-b)
            BUILD=true
            shift
            ;;
        --clean|-c)
            CLEAN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./restart-platform.sh [--build] [--clean]"
            echo "  --build, -b    Rebuild Docker images"
            echo "  --clean, -c    Clean volumes and restart fresh"
            exit 1
            ;;
    esac
done

# Stop services
echo "${BLUE}Step 1: Stopping services...${NC}"
docker-compose down
echo "${GREEN}✓ Services stopped${NC}"
echo ""

# Clean if requested
if [ "$CLEAN" = true ]; then
    echo "${YELLOW}Step 2: Cleaning volumes...${NC}"
    docker-compose down -v
    echo "${GREEN}✓ Volumes cleaned${NC}"
    echo ""
fi

# Build if requested
if [ "$BUILD" = true ]; then
    echo "${BLUE}Step 2: Building images...${NC}"
    docker-compose build rating-api admin-ui
    echo "${GREEN}✓ Images built${NC}"
    echo ""
fi

# Start services
echo "${BLUE}Step 3: Starting services...${NC}"
docker-compose up -d postgres rating-api admin-ui
echo "${GREEN}✓ Services started${NC}"
echo ""

# Wait for health
echo "${BLUE}Step 4: Waiting for services to be healthy...${NC}"
echo "Waiting for rating-api..."
for i in {1..30}; do
    if curl -s http://localhost:3002/health > /dev/null 2>&1; then
        echo "${GREEN}✓ Rating API is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

echo "Waiting for admin-ui..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "${GREEN}✓ Admin UI is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

echo "${GREEN}================================${NC}"
echo "${GREEN}✅ Platform Restarted!${NC}"
echo "${GREEN}================================${NC}"
echo ""
echo "📍 Access Points:"
echo "  Admin UI:     http://localhost:5173"
echo "  Rating API:   http://localhost:3002"
echo "  API Docs:     http://localhost:3002/api/docs"
echo ""
echo "📊 View Logs:"
echo "  docker-compose logs -f"
echo ""
