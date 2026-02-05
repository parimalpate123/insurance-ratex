#!/bin/bash

# Show logs for all services or specific service
# Usage: ./logs.sh [service-name]
#
# Examples:
#   ./logs.sh                    # All services
#   ./logs.sh orchestrator       # Orchestrator only
#   ./logs.sh mapping-ui         # Mapping UI only

SERVICE=${1:-}

if [ -z "$SERVICE" ]; then
    echo "📋 Showing logs for all services (Ctrl+C to exit)..."
    echo ""
    docker-compose logs -f
else
    echo "📋 Showing logs for $SERVICE (Ctrl+C to exit)..."
    echo ""
    docker-compose logs -f "$SERVICE"
fi
