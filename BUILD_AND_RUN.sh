#!/bin/bash

# InsurRateX - Build and Run Script
# This script builds and starts all services

set -e  # Exit on error

echo "🚀 InsurRateX - Build and Run"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Stop any running containers
echo -e "${YELLOW}Step 1: Stopping any running containers...${NC}"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Stopped${NC}"
echo ""

# Step 2: Build all services
echo -e "${YELLOW}Step 2: Building Docker images (this will take 3-5 minutes)...${NC}"
echo "Building:"
echo "  - Orchestrator"
echo "  - Guidewire Mock"
echo "  - Earnix Mock"
echo "  - Mapping UI"
echo "  - Rules UI"
echo ""

if docker-compose build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    echo ""
    echo "Try this:"
    echo "  docker system prune -f"
    echo "  docker-compose build --no-cache"
    exit 1
fi
echo ""

# Step 3: Start services
echo -e "${YELLOW}Step 3: Starting services...${NC}"
if docker-compose up -d; then
    echo -e "${GREEN}✓ Services started${NC}"
else
    echo -e "${RED}✗ Failed to start services${NC}"
    exit 1
fi
echo ""

# Step 4: Wait for services to initialize
echo -e "${YELLOW}Step 4: Waiting for services to initialize (30 seconds)...${NC}"
for i in {30..1}; do
    echo -ne "\r  ${i} seconds remaining..."
    sleep 1
done
echo -e "\r${GREEN}✓ Wait complete${NC}                    "
echo ""

# Step 5: Check health
echo -e "${YELLOW}Step 5: Checking service health...${NC}"

services=(
  "Orchestrator:http://localhost:3000/health"
  "Guidewire Mock:http://localhost:3001/health"
  "Earnix Mock:http://localhost:4001/health"
)

all_healthy=true

for service in "${services[@]}"; do
  IFS=: read -r name url <<< "$service"
  echo -n "  Testing $name... "
  if curl -sf "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
  else
    echo -e "${RED}✗ FAILED${NC}"
    all_healthy=false
  fi
done

echo -n "  Testing Mapping UI... "
if curl -sf http://localhost:8080 > /dev/null 2>&1; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAILED${NC}"
  all_healthy=false
fi

echo -n "  Testing Rules UI... "
if curl -sf http://localhost:8081 > /dev/null 2>&1; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAILED${NC}"
  all_healthy=false
fi

echo ""

# Step 6: Summary
if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}════════════════════════════════${NC}"
    echo -e "${GREEN}✓ All services are running!${NC}"
    echo -e "${GREEN}════════════════════════════════${NC}"
    echo ""
    echo "Service URLs:"
    echo "  📊 Orchestrator API:  http://localhost:3000"
    echo "  🗺️  Mapping UI:        http://localhost:8080"
    echo "  📐 Rules UI:          http://localhost:8081"
    echo "  🏢 Guidewire Mock:    http://localhost:3001"
    echo "  💰 Earnix Mock:       http://localhost:4001"
    echo ""
    echo "Quick Test:"
    echo "  curl http://localhost:3000/health"
    echo ""
    echo "View Logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "Stop Services:"
    echo "  docker-compose down"
else
    echo -e "${RED}════════════════════════════════${NC}"
    echo -e "${RED}⚠️  Some services failed${NC}"
    echo -e "${RED}════════════════════════════════${NC}"
    echo ""
    echo "Check logs:"
    echo "  docker-compose logs"
    echo ""
    echo "Check specific service:"
    echo "  docker-compose logs orchestrator"
    echo "  docker-compose logs guidewire-mock"
    echo "  docker-compose logs earnix-mock"
fi

echo ""
