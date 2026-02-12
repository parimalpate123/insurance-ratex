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

# Start postgres + minio first
echo "${BLUE}Step 3: Starting PostgreSQL and MinIO...${NC}"
docker-compose up -d postgres minio
echo "Waiting for PostgreSQL..."
for i in {1..20}; do
    if docker-compose exec -T postgres pg_isready -U insurratex > /dev/null 2>&1; then
        echo "${GREEN}✓ PostgreSQL ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Run migrations (use inline if to avoid set -e killing the script on non-zero exit)
echo "${BLUE}Step 4: Running database migrations...${NC}"

if docker-compose exec -T postgres psql -U insurratex -d insurratex -c "\d product_line_configs" > /dev/null 2>&1; then
    echo "${GREEN}✓ Migration 005 already applied${NC}"
else
    echo "Applying migration 005..."
    docker-compose exec -T postgres psql -U insurratex -d insurratex < database/migrations/005_product_line_configuration.sql > /dev/null 2>&1
    echo "${GREEN}✓ Migration 005 applied${NC}"
fi

if docker-compose exec -T postgres psql -U insurratex -d insurratex -c "SELECT ai_status FROM uploaded_files LIMIT 1" > /dev/null 2>&1; then
    echo "${GREEN}✓ Migration 006 already applied${NC}"
else
    echo "Applying migration 006..."
    docker-compose exec -T postgres psql -U insurratex -d insurratex < database/migrations/006_kb_s3_columns.sql > /dev/null 2>&1
    echo "${GREEN}✓ Migration 006 applied${NC}"
fi
echo ""

# Start app services
echo "${BLUE}Step 5: Starting Rating API and Admin UI...${NC}"
docker-compose up -d rating-api admin-ui
echo "${GREEN}✓ Services started${NC}"
echo ""

# Wait for health
echo "${BLUE}Step 6: Waiting for services to be healthy...${NC}"
echo "Waiting for rating-api..."
for i in {1..40}; do
    if curl -s http://localhost:3002/health > /dev/null 2>&1; then
        echo "${GREEN}✓ Rating API is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
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
echo "  Admin UI:        http://localhost:5173"
echo "  Rating API:      http://localhost:3002"
echo "  API Docs:        http://localhost:3002/api/docs"
echo "  MinIO Console:   http://localhost:9001  (user: insurratex / dev_password_change_in_prod)"
echo ""
echo "📊 View Logs:"
echo "  docker-compose logs -f rating-api"
echo "  docker-compose logs -f admin-ui"
echo ""
