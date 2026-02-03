#!/bin/bash

echo "======================================"
echo "Starting InsurRateX with PostgreSQL"
echo "======================================"
echo ""

echo "Step 1: Starting PostgreSQL..."
docker-compose up -d postgres

echo ""
echo "Step 2: Waiting for PostgreSQL to be ready (this may take 30 seconds)..."
timeout 60 bash -c 'until docker-compose exec -T postgres pg_isready -U insurratex > /dev/null 2>&1; do sleep 2; done' || {
    echo "⚠️  PostgreSQL didn't start in time. Checking logs..."
    docker-compose logs postgres | tail -20
    exit 1
}

echo "✅ PostgreSQL is ready!"
echo ""

echo "Step 3: Verifying database schema..."
docker-compose exec -T postgres psql -U insurratex -d insurratex -c "\dt" | head -20

echo ""
echo "Step 4: Starting all other services..."
docker-compose up -d

echo ""
echo "Step 5: Waiting for services to start..."
sleep 10

echo ""
echo "======================================"
echo "✅ All Services Started!"
echo "======================================"
echo ""
echo "Service URLs:"
echo "  📊 Orchestrator API:  http://localhost:3000"
echo "  📚 API Docs (Swagger): http://localhost:3000/api/docs"
echo "  🗺️  Mapping UI:        http://localhost:8080"
echo "  📋 Rules UI:          http://localhost:8081"
echo "  🐘 PostgreSQL:        localhost:5432"
echo ""
echo "Database Connection:"
echo "  Host:     localhost"
echo "  Port:     5432"
echo "  Database: insurratex"
echo "  User:     insurratex"
echo "  Password: dev_password_change_in_prod"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To connect to database:"
echo "  docker-compose exec postgres psql -U insurratex -d insurratex"
echo ""
