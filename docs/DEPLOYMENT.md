# InsurRateX Deployment Guide

Guide for deploying InsurRateX to various environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [AWS ECS Deployment](#aws-ecs-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Monitoring & Observability](#monitoring--observability)
6. [Security Considerations](#security-considerations)

---

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm or yarn

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd rating-poc

# Install dependencies
npm install

# Start all services
docker-compose up
```

Services will be available at:
- Orchestrator: http://localhost:3000
- Guidewire Mock: http://localhost:3001
- Earnix Mock: http://localhost:4001

---

## Docker Deployment

### Build Images

```bash
# Build orchestrator
docker build -t insurratex/orchestrator:latest apps/orchestrator

# Build Guidewire mock
docker build -t insurratex/guidewire-mock:latest packages/mocks/guidewire-mock

# Build Earnix mock
docker build -t insurratex/earnix-mock:latest packages/mocks/earnix-mock
```

### Run with Docker Compose

```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Create `.env` file:

```bash
# Orchestrator
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Guidewire Mock
GUIDEWIRE_PORT=3001

# Earnix Mock
EARNIX_PORT=4001

# Database (future)
DATABASE_URL=postgresql://user:password@localhost:5432/insurratex
```

---

## AWS ECS Deployment

### Architecture

```
┌─────────────────┐
│  Application    │
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │   ECS   │
    │ Cluster │
    └────┬────┘
         │
    ┌────┴─────────┐
    │   Services   │
    ├──────────────┤
    │ Orchestrator │
    │ Guidewire    │
    │ Earnix       │
    └──────────────┘
```

### Step 1: Create ECR Repositories

```bash
# Create ECR repositories
aws ecr create-repository --repository-name insurratex/orchestrator
aws ecr create-repository --repository-name insurratex/guidewire-mock
aws ecr create-repository --repository-name insurratex/earnix-mock

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Build and Push Images

```bash
# Orchestrator
docker build -t insurratex/orchestrator:latest apps/orchestrator
docker tag insurratex/orchestrator:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/insurratex/orchestrator:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/insurratex/orchestrator:latest

# Guidewire Mock
docker build -t insurratex/guidewire-mock:latest packages/mocks/guidewire-mock
docker tag insurratex/guidewire-mock:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/insurratex/guidewire-mock:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/insurratex/guidewire-mock:latest

# Earnix Mock
docker build -t insurratex/earnix-mock:latest packages/mocks/earnix-mock
docker tag insurratex/earnix-mock:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/insurratex/earnix-mock:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/insurratex/earnix-mock:latest
```

### Step 3: Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name insurratex-cluster
```

### Step 4: Create Task Definitions

**orchestrator-task-definition.json:**
```json
{
  "family": "insurratex-orchestrator",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "orchestrator",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/insurratex/orchestrator:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3000" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/insurratex-orchestrator",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task definition:
```bash
aws ecs register-task-definition --cli-input-json file://orchestrator-task-definition.json
```

### Step 5: Create ECS Service

```bash
aws ecs create-service \
  --cluster insurratex-cluster \
  --service-name orchestrator-service \
  --task-definition insurratex-orchestrator \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=orchestrator,containerPort=3000"
```

### Step 6: Configure Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name insurratex-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target group
aws elbv2 create-target-group \
  --name insurratex-orchestrator-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /health

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

---

## Kubernetes Deployment

### Prerequisites
- kubectl configured
- Kubernetes cluster (EKS, GKE, or local)
- Docker registry access

### Step 1: Create Namespace

```bash
kubectl create namespace insurratex
```

### Step 2: Create Deployments

**orchestrator-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orchestrator
  namespace: insurratex
spec:
  replicas: 3
  selector:
    matchLabels:
      app: orchestrator
  template:
    metadata:
      labels:
        app: orchestrator
    spec:
      containers:
      - name: orchestrator
        image: insurratex/orchestrator:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: orchestrator-service
  namespace: insurratex
spec:
  selector:
    app: orchestrator
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

Apply:
```bash
kubectl apply -f orchestrator-deployment.yaml
```

### Step 3: Create Ingress

**ingress.yaml:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: insurratex-ingress
  namespace: insurratex
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.insurratex.com
    secretName: insurratex-tls
  rules:
  - host: api.insurratex.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: orchestrator-service
            port:
              number: 80
```

Apply:
```bash
kubectl apply -f ingress.yaml
```

---

## Monitoring & Observability

### Logging

**CloudWatch Logs (AWS):**
```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/insurratex-orchestrator

# View logs
aws logs tail /ecs/insurratex-orchestrator --follow
```

**Kubernetes:**
```bash
# View logs
kubectl logs -f deployment/orchestrator -n insurratex

# View logs from all pods
kubectl logs -l app=orchestrator -n insurratex --all-containers=true
```

### Metrics

**Prometheus & Grafana (Kubernetes):**

Install Prometheus:
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

Access Grafana:
```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

### Health Checks

All services expose `/health` endpoint:

```bash
# Check orchestrator
curl http://localhost:3000/health

# Expected response
{
  "status": "ok",
  "service": "orchestrator",
  "version": "1.0.0"
}
```

---

## Security Considerations

### 1. API Authentication

Implement API key authentication:

```typescript
// Add to orchestrator
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### 2. HTTPS/TLS

Use Let's Encrypt or AWS Certificate Manager for TLS certificates.

**AWS ALB:**
```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=...
```

### 3. Environment Variables

Never commit secrets to git. Use AWS Secrets Manager or Kubernetes Secrets:

**Kubernetes Secret:**
```bash
kubectl create secret generic insurratex-secrets \
  --from-literal=api-key=your-api-key \
  --from-literal=db-password=your-password \
  -n insurratex
```

Reference in deployment:
```yaml
env:
- name: API_KEY
  valueFrom:
    secretKeyRef:
      name: insurratex-secrets
      key: api-key
```

### 4. Network Security

**AWS Security Groups:**
- Allow inbound on port 3000 only from ALB
- Allow outbound to rating engines
- Restrict database access to ECS tasks only

**Kubernetes Network Policies:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: orchestrator-policy
  namespace: insurratex
spec:
  podSelector:
    matchLabels:
      app: orchestrator
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: insurratex
    ports:
    - protocol: TCP
      port: 3000
```

---

## Scaling

### Horizontal Pod Autoscaling (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: orchestrator-hpa
  namespace: insurratex
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: orchestrator
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### ECS Auto Scaling

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/insurratex-cluster/orchestrator-service \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/insurratex-cluster/orchestrator-service \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

---

## CI/CD Pipeline

### GitHub Actions Example

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to AWS ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

      - name: Build and push
        run: |
          docker build -t insurratex/orchestrator:${{ github.sha }} apps/orchestrator
          docker tag insurratex/orchestrator:${{ github.sha }} <account-id>.dkr.ecr.us-east-1.amazonaws.com/insurratex/orchestrator:${{ github.sha }}
          docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/insurratex/orchestrator:${{ github.sha }}

      - name: Update ECS service
        run: |
          aws ecs update-service --cluster insurratex-cluster --service orchestrator-service --force-new-deployment
```

---

## Troubleshooting

### Check Service Status

**Docker:**
```bash
docker-compose ps
docker-compose logs orchestrator
```

**Kubernetes:**
```bash
kubectl get pods -n insurratex
kubectl describe pod <pod-name> -n insurratex
kubectl logs <pod-name> -n insurratex
```

**ECS:**
```bash
aws ecs describe-services --cluster insurratex-cluster --services orchestrator-service
aws ecs list-tasks --cluster insurratex-cluster --service-name orchestrator-service
```

### Common Issues

1. **Service won't start**: Check logs for errors
2. **Connection refused**: Verify network configuration and security groups
3. **High memory usage**: Increase container memory limits
4. **Slow performance**: Check database connections and add caching

---

For more information:
- [Quick Start Guide](QUICK_START.md)
- [Architecture Documentation](ARCHITECTURE.md)
- [API Reference](API.md)
