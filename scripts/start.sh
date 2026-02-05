#!/bin/bash

# Start all services
echo "🚀 Starting InsurRateX services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
docker ps --format "table {{.Names}}\t{{.Status}}" | grep insurratex

echo ""
echo "✅ Services started!"
echo "   • Mapping UI: http://localhost:8080"
echo "   • Orchestrator API: http://localhost:3000"
