# InsurRateX - Quick Start Guide

Get the InsurRateX platform up and running in minutes!

## Prerequisites

- Docker Desktop installed and running
- Ports available: 3002 (API), 5173 (UI), 5432 (PostgreSQL)

## Quick Start (First Time)

```bash
# Make scripts executable (first time only)
chmod +x start.sh restart-platform.sh test-platform.sh

# Start the platform
./start.sh
```

This will:
1. Check if Docker is running
2. Run database migrations
3. Start all services (PostgreSQL, Rating API, Admin UI)
4. Wait for services to be healthy
5. Display access URLs

**Access Points:**
- **Admin UI**: http://localhost:5173 - Main interface for managing product lines
- **Rating API**: http://localhost:3002 - Backend API endpoints
- **API Docs**: http://localhost:3002/api/docs - Swagger documentation
- **Health Check**: http://localhost:3002/health - API health status

## Restart Services

### Quick Restart
```bash
./restart-platform.sh
```

### Restart with Rebuild (after code changes)
```bash
./restart-platform.sh --build
```

### Clean Restart (remove all data)
```bash
./restart-platform.sh --clean
```

## Test the Platform

Run automated tests to verify everything is working:

```bash
./test-platform.sh
```

This tests:
- Backend health check
- Product lines API
- Templates API
- Admin UI accessibility
- Rating execution

## Manual Testing

### 1. View Dashboard
```bash
open http://localhost:5173
```
- See GL_EXISTING product line stats
- View workflow configuration
- Check integration details

### 2. Test Rating Execution
```bash
curl -X POST http://localhost:3002/api/v1/product-lines/GL_EXISTING/execute \
  -H "Content-Type: application/json" \
  -d '{
    "quoteNumber": "TEST-001",
    "productCode": "GL",
    "insured": {
      "name": "Test Company",
      "state": "CA",
      "annualRevenue": 5000000
    }
  }'
```

### 3. Get Product Lines
```bash
curl http://localhost:3002/api/v1/product-lines
```

### 4. Get Templates
```bash
curl http://localhost:3002/api/v1/product-lines/templates
```

## Common Tasks

### View Logs

**All services:**
```bash
docker-compose logs -f
```

**Rating API only:**
```bash
docker-compose logs -f rating-api
```

**Admin UI only:**
```bash
docker-compose logs -f admin-ui
```

### Stop Services
```bash
docker-compose down
```

### Check Service Status
```bash
docker-compose ps
```

### Access PostgreSQL
```bash
docker-compose exec postgres psql -U insurratex -d insurratex
```

## User Journey

### Create a New Product Line

1. **Open Admin UI**: http://localhost:5173
2. Click **"New Product Line"** button
3. Follow the 5-step wizard:
   - **Step 1**: Enter product details (code, name, owner)
   - **Step 2**: Select source system and target rating engine
   - **Step 3**: Choose template or start from scratch
   - **Step 4**: Configure workflow steps (enable/disable)
   - **Step 5**: Review and create
4. Your new product line is ready!

### Test a Rating

1. **Navigate to Test Rating**: Click "Test Rating" in the navigation
2. **Select Product Line**: Choose from dropdown (e.g., GL_EXISTING)
3. **Edit Request**: Use the JSON editor or sample data
4. **Execute**: Click "Execute Rating" button
5. **View Results**: See premium, rules applied, execution time

### Browse Product Lines

1. **Navigate to Product Lines**: Click "Product Lines" in navigation
2. **View All Lines**: See active product lines and templates
3. **View Details**: Click "View" on any product line
4. **Edit/Delete**: Use action buttons in detail view

## Troubleshooting

### Services Won't Start

**Check Docker is running:**
```bash
docker info
```

**Check port conflicts:**
```bash
lsof -i :3002  # Rating API
lsof -i :5173  # Admin UI
lsof -i :5432  # PostgreSQL
```

**View error logs:**
```bash
docker-compose logs rating-api
```

### Database Migration Issues

**Reset database:**
```bash
./restart-platform.sh --clean
```

**Run migrations manually:**
```bash
docker-compose exec postgres psql -U insurratex -d insurratex < database/migrations/001_initial_schema.sql
```

### UI Not Loading

**Check if admin-ui is running:**
```bash
docker-compose ps admin-ui
```

**Rebuild admin-ui:**
```bash
./restart-platform.sh --build
```

**Check browser console** for errors (F12 → Console tab)

### API Returning Errors

**Check API health:**
```bash
curl http://localhost:3002/health
```

**View API logs:**
```bash
docker-compose logs -f rating-api
```

**Clear cache:**
```bash
curl -X POST http://localhost:3002/api/v1/product-lines/cache/clear
```

## Environment Variables

Default configuration in `.env`:
```
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=insurratex
POSTGRES_PASSWORD=insurratex123
POSTGRES_DB=insurratex
API_PORT=3002
UI_PORT=5173
```

## Architecture Overview

```
┌─────────────┐
│  Admin UI   │  http://localhost:5173
│  (React)    │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│ Rating API  │  http://localhost:3002
│  (NestJS)   │
└──────┬──────┘
       │ TypeORM
       ▼
┌─────────────┐
│ PostgreSQL  │  localhost:5432
│  Database   │
└─────────────┘
```

## What's Included

**Backend (Rating API):**
- Product line configuration management
- Workflow engine (validate, transform, rules, calculate)
- Mapping service (9 transformation types)
- Rules service (15+ operators, 7 action types)
- REST API with Swagger docs

**Frontend (Admin UI):**
- Dashboard with product line overview
- 5-step onboarding wizard
- Test rating interface
- Product line CRUD operations
- Responsive design with Tailwind CSS

**Database:**
- Product line configurations
- Workflow definitions
- Mappings and field mappings
- Business rules and conditions
- Seeded with GL_EXISTING sample product line

## Next Steps

1. **Explore the Dashboard**: Get familiar with the UI
2. **Create a Product Line**: Use the onboarding wizard
3. **Test Rating Execution**: Try the sample request
4. **Review API Docs**: http://localhost:3002/api/docs
5. **Read Full Documentation**: See `PHASE3_COMPLETE.md`

## Support

- View logs: `docker-compose logs -f`
- Run tests: `./test-platform.sh`
- Check status: `docker-compose ps`
- Full docs: `README.md` and `PHASE3_COMPLETE.md`

---

**Platform Status**: Phase 3 Complete ✅

**Last Updated**: 2026-02-06
