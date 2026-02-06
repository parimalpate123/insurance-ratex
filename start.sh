#!/bin/bash

# InsurRateX - Start All Services
# This script starts the complete platform

set -e

echo "🚀 Starting InsurRateX Platform"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "${BLUE}Step 1: Starting PostgreSQL database${NC}"
docker-compose up -d postgres
echo "Waiting for PostgreSQL to be ready..."
sleep 5
echo "${GREEN}✓ PostgreSQL started${NC}"
echo ""

echo "${BLUE}Step 2: Running database migrations${NC}"
echo "Checking if migrations are needed..."
docker-compose exec -T postgres psql -U insurratex -d insurratex -c "\d product_line_configs" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Running migration 005_product_line_configuration.sql..."
    docker-compose exec -T postgres psql -U insurratex -d insurratex < database/migrations/005_product_line_configuration.sql > /dev/null 2>&1
    echo "${GREEN}✓ Migration completed${NC}"
else
    echo "${GREEN}✓ Migrations already applied${NC}"
fi
echo ""

echo "${BLUE}Step 3: Starting Rating API and Admin UI${NC}"
docker-compose up -d rating-api admin-ui
echo ""

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
echo "${GREEN}✅ InsurRateX Platform Started!${NC}"
echo "${GREEN}================================${NC}"
echo ""
echo "📍 Access Points:"
echo ""
echo "  ${BLUE}Admin UI:${NC}        http://localhost:5173"
echo "                   Main interface for managing product lines"
echo ""
echo "  ${BLUE}Rating API:${NC}      http://localhost:3002"
echo "                   Backend API endpoints"
echo ""
echo "  ${BLUE}API Docs:${NC}        http://localhost:3002/api/docs"
echo "                   Swagger documentation"
echo ""
echo "  ${BLUE}Health Check:${NC}    http://localhost:3002/health"
echo "                   API health status"
echo ""
echo "📊 Quick Test:"
echo "  curl http://localhost:3002/api/v1/product-lines"
echo ""
echo "📚 View Logs:"
echo "  docker-compose logs -f rating-api    # Rating API logs"
echo "  docker-compose logs -f admin-ui      # Admin UI logs"
echo ""
echo "🛑 Stop Services:"
echo "  docker-compose down"
echo ""
echo "🔄 Restart Services:"
echo "  ./restart-platform.sh              # Quick restart"
echo "  ./restart-platform.sh --build      # Rebuild and restart"
echo "  ./restart-platform.sh --clean      # Clean restart (removes all data)"
echo ""
