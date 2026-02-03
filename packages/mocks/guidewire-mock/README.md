# Guidewire PolicyCenter Mock Server

Mock implementation of Guidewire PolicyCenter API for InsurRateX development and testing.

## Features

- ✅ Rating submission endpoint
- ✅ Policy retrieval endpoint
- ✅ Policy bind endpoint
- ✅ Health check endpoint
- ✅ Request validation
- ✅ Realistic GL premium calculation
- ✅ Docker container ready
- ✅ AWS ECR/ECS compatible

## API Endpoints

### Rating
- `POST /pc/rating/submit` - Submit policy for rating
- `GET /pc/rating/quote/:quoteNumber` - Get quote details

### Policy
- `GET /pc/policy/:policyNumber` - Get policy details
- `GET /pc/policy/:policyNumber/bind` - Bind policy

### Health
- `GET /health` - Health check

## Running Locally

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm run start:prod
```

Server will start on `http://localhost:3001`

## Running with Docker

```bash
# Build image
docker build -t guidewire-mock .

# Run container
docker run -p 3001:3001 guidewire-mock

# Or use docker-compose from project root
docker-compose up guidewire-mock
```

## Testing

```bash
# Health check
curl http://localhost:3001/health

# Submit rating request
curl -X POST http://localhost:3001/pc/rating/submit \
  -H "Content-Type: application/json" \
  -d @src/rating/data/sample-gl-policy.json
```

## Sample Request

See `src/rating/data/sample-gl-policy.json` for a complete GL policy example.

## AWS Deployment

This container is ready for AWS deployment:

### ECR (Elastic Container Registry)
```bash
# Tag image
docker tag guidewire-mock:latest <aws_account_id>.dkr.ecr.<region>.amazonaws.com/guidewire-mock:latest

# Push to ECR
docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/guidewire-mock:latest
```

### ECS/Fargate
- Task Definition: 0.5 vCPU, 1GB memory
- Health Check: /health endpoint
- Port: 3001
- Environment: NODE_ENV=production

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
