#!/bin/bash

# InsurRateX Rating API Setup Script
# This script helps set up the new rating-api implementation

set -e

echo "🚀 InsurRateX Rating API Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "${BLUE}Step 1: Installing shared-types package${NC}"
cd packages/shared-types
npm install
echo "${GREEN}✓ Shared types installed${NC}"
echo ""

echo "${BLUE}Step 2: Installing rating-api dependencies${NC}"
cd ../../apps/rating-api
npm install
echo "${GREEN}✓ Rating API dependencies installed${NC}"
echo ""

echo "${BLUE}Step 3: Running database migration${NC}"
cd ../../
# Check if psql is available
if command -v psql &> /dev/null; then
    read -p "Run migration 005_product_line_configuration.sql? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        psql -U insurratex -d insurratex -f database/migrations/005_product_line_configuration.sql
        echo "${GREEN}✓ Migration completed${NC}"
    else
        echo "${YELLOW}⚠ Skipped migration. Run manually:${NC}"
        echo "  psql -U insurratex -d insurratex -f database/migrations/005_product_line_configuration.sql"
    fi
else
    echo "${YELLOW}⚠ psql not found. Run migration manually:${NC}"
    echo "  psql -U insurratex -d insurratex -f database/migrations/005_product_line_configuration.sql"
fi
echo ""

echo "${BLUE}Step 4: Building TypeScript${NC}"
cd packages/shared-types
npm run build
echo "${GREEN}✓ Shared types built${NC}"
echo ""

echo "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Start services with: ${BLUE}docker-compose up rating-api${NC}"
echo "  2. Or run locally with: ${BLUE}cd apps/rating-api && npm run dev${NC}"
echo "  3. Access Swagger docs: ${BLUE}http://localhost:3002/api/docs${NC}"
echo "  4. Test endpoint: ${BLUE}curl http://localhost:3002/api/v1/product-lines${NC}"
echo ""
echo "📚 Documentation:"
echo "  - Rating API: apps/rating-api/README.md"
echo "  - Overview: MARKETPLACE_IMPLEMENTATION.md"
echo "  - Full Plan: docs/RATING_DOMAIN_IMPLEMENTATION_PLAN.md"
