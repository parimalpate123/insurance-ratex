#!/bin/bash

echo "======================================"
echo "Force Rebuilding Orchestrator"
echo "======================================"
echo ""

# Stop the orchestrator
echo "Stopping orchestrator..."
docker-compose stop orchestrator

# Remove the container
echo "Removing old container..."
docker-compose rm -f orchestrator

# Remove the image
echo "Removing old image..."
docker rmi rating-poc-orchestrator 2>/dev/null || true

# Prune build cache
echo "Pruning Docker build cache..."
docker builder prune -f

# Build with no cache
echo "Rebuilding with no cache (this may take a few minutes)..."
DOCKER_BUILDKIT=1 docker-compose build --no-cache --progress=plain orchestrator 2>&1 | tail -20

# Start the orchestrator
echo ""
echo "Starting orchestrator..."
docker-compose up -d orchestrator

# Wait for startup
echo "Waiting 15 seconds for service to start..."
sleep 15

# Check logs for AI initialization
echo ""
echo "======================================"
echo "Checking AI Services initialization..."
echo "======================================"
docker-compose logs orchestrator | grep -A 2 "AI Services"

echo ""
echo "======================================"
echo "Checking registered routes..."
echo "======================================"
docker-compose logs orchestrator | grep "AIController"

echo ""
echo "======================================"
echo "All Routes:"
echo "======================================"
docker-compose logs orchestrator | grep "Mapped {"

echo ""
echo "If you see AIController routes above, the rebuild was successful!"
echo "If not, check logs with: docker-compose logs orchestrator"
