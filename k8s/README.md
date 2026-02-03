# Kubernetes Deployment

Kubernetes manifests for deploying InsurRateX to any Kubernetes cluster.

## Structure

```
k8s/
├── base/                       # Base manifests
│   ├── namespace.yaml         # Namespace
│   ├── *-deployment.yaml      # Deployments & Services
│   ├── ingress.yaml           # Ingress configuration
│   ├── hpa.yaml               # Horizontal Pod Autoscaling
│   └── kustomization.yaml     # Base kustomization
└── overlays/
    ├── dev/                   # Development environment
    │   └── kustomization.yaml
    └── prod/                  # Production environment
        └── kustomization.yaml
```

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- kustomize (built into kubectl)
- Ingress controller (nginx)
- cert-manager (for TLS)

## Quick Deploy

### Development

```bash
# Apply development configuration
kubectl apply -k k8s/overlays/dev

# Verify deployment
kubectl get pods -n insurratex-dev
kubectl get services -n insurratex-dev
```

### Production

```bash
# Apply production configuration
kubectl apply -k k8s/overlays/prod

# Verify deployment
kubectl get pods -n insurratex
kubectl get services -n insurratex
kubectl get ingress -n insurratex
```

## Services

| Service | Port | Replicas (Prod) | Resources |
|---------|------|-----------------|-----------|
| Orchestrator | 3000 | 3-10 (HPA) | 512Mi-1Gi, 250m-500m |
| Guidewire Mock | 3001 | 2-5 (HPA) | 256Mi-512Mi, 100m-250m |
| Earnix Mock | 4001 | 2-5 (HPA) | 256Mi-512Mi, 100m-250m |
| Mapping UI | 8080 | 2 | 128Mi-256Mi, 50m-100m |
| Rules UI | 8081 | 2 | 128Mi-256Mi, 50m-100m |

## Ingress Configuration

The platform exposes three domains:

- **api.insurratex.com** → Orchestrator (3000)
- **mapping.insurratex.com** → Mapping UI (8080)
- **rules.insurratex.com** → Rules UI (8081)

### DNS Setup

Point your domains to the ingress controller's load balancer:

```bash
# Get load balancer IP
kubectl get ingress insurratex-ingress -n insurratex

# Add DNS A records:
# api.insurratex.com → <EXTERNAL-IP>
# mapping.insurratex.com → <EXTERNAL-IP>
# rules.insurratex.com → <EXTERNAL-IP>
```

### TLS Certificates

Uses cert-manager with Let's Encrypt:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@insurratex.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Horizontal Pod Autoscaling

Autoscaling is configured for backend services:

**Orchestrator:**
- Min: 3 replicas
- Max: 10 replicas
- Target CPU: 70%
- Target Memory: 80%

**Mocks:**
- Min: 2 replicas
- Max: 5 replicas
- Target CPU: 70%

### View HPA Status

```bash
kubectl get hpa -n insurratex

# Watch autoscaling in action
kubectl get hpa -n insurratex -w
```

## Monitoring

### View Logs

```bash
# All pods
kubectl logs -f -l platform=insurratex -n insurratex

# Specific service
kubectl logs -f deployment/orchestrator -n insurratex
kubectl logs -f deployment/guidewire-mock -n insurratex

# Previous pod (after crash)
kubectl logs deployment/orchestrator -n insurratex --previous
```

### Check Pod Status

```bash
# List all pods
kubectl get pods -n insurratex

# Describe pod (for troubleshooting)
kubectl describe pod <pod-name> -n insurratex

# Get pod events
kubectl get events -n insurratex --sort-by='.lastTimestamp'
```

### Resource Usage

```bash
# Current resource usage
kubectl top pods -n insurratex
kubectl top nodes

# Resource requests/limits
kubectl describe deployment orchestrator -n insurratex | grep -A 5 Resources
```

## Scaling

### Manual Scaling

```bash
# Scale deployment
kubectl scale deployment orchestrator --replicas=5 -n insurratex

# Scale down
kubectl scale deployment orchestrator --replicas=2 -n insurratex
```

### Update HPA Limits

```bash
# Edit HPA
kubectl edit hpa orchestrator-hpa -n insurratex

# Or patch it
kubectl patch hpa orchestrator-hpa -n insurratex \
  --type=merge \
  -p '{"spec":{"maxReplicas":15}}'
```

## Updates and Rollouts

### Rolling Update

```bash
# Update image
kubectl set image deployment/orchestrator \
  orchestrator=insurratex/orchestrator:v2.0.0 \
  -n insurratex

# Watch rollout
kubectl rollout status deployment/orchestrator -n insurratex
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/orchestrator -n insurratex

# Rollback to previous version
kubectl rollout undo deployment/orchestrator -n insurratex

# Rollback to specific revision
kubectl rollout undo deployment/orchestrator --to-revision=2 -n insurratex
```

### Restart Deployment

```bash
# Restart all pods (rolling restart)
kubectl rollout restart deployment/orchestrator -n insurratex
```

## Configuration

### Environment Variables

Edit deployments to add/modify environment variables:

```bash
kubectl edit deployment orchestrator -n insurratex
```

Or use kustomize patches in overlay directories.

### Secrets

```bash
# Create secret for API keys
kubectl create secret generic ai-secrets \
  --from-literal=openai-api-key=sk-... \
  -n insurratex

# Use in deployment
kubectl set env deployment/orchestrator \
  --from=secret/ai-secrets \
  -n insurratex
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n insurratex

# Describe pod to see events
kubectl describe pod <pod-name> -n insurratex

# Check logs
kubectl logs <pod-name> -n insurratex
```

### Service Not Accessible

```bash
# Test service from within cluster
kubectl run -n insurratex curl-test --image=curlimages/curl --rm -i --restart=Never -- \
  curl -v http://orchestrator-service:3000/health

# Check service endpoints
kubectl get endpoints orchestrator-service -n insurratex
```

### Ingress Issues

```bash
# Check ingress
kubectl describe ingress insurratex-ingress -n insurratex

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

### High Memory/CPU Usage

```bash
# Check current usage
kubectl top pods -n insurratex

# View resource limits
kubectl describe pod <pod-name> -n insurratex | grep -A 10 Limits

# Adjust limits in deployment
kubectl edit deployment orchestrator -n insurratex
```

## Clean Up

```bash
# Delete development environment
kubectl delete -k k8s/overlays/dev

# Delete production environment
kubectl delete -k k8s/overlays/prod

# Delete namespace (removes everything)
kubectl delete namespace insurratex
```

## Best Practices

1. **Always use kustomize overlays** for environment-specific config
2. **Set resource requests and limits** for predictable performance
3. **Configure HPA** for automatic scaling
4. **Use health checks** (liveness and readiness probes)
5. **Enable TLS** for production ingress
6. **Monitor logs and metrics** regularly
7. **Test rollbacks** in development first
8. **Use secrets** for sensitive data
9. **Tag images properly** (avoid :latest in production)
10. **Document changes** in Git commits

## Advanced Topics

### StatefulSets (Future)

For database or stateful services:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  # ...
```

### ConfigMaps

For application configuration:

```bash
kubectl create configmap app-config \
  --from-file=config.json \
  -n insurratex
```

### Network Policies

For pod-to-pod communication control:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-orchestrator
spec:
  podSelector:
    matchLabels:
      app: orchestrator
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          component: frontend
```

## Support

For issues or questions:
1. Check pod logs
2. Review events
3. Consult [Kubernetes documentation](https://kubernetes.io/docs/)
4. Open an issue in the repository

---

**InsurRateX** - Production-ready Kubernetes deployment.
