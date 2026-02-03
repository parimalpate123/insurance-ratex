# Architecture Decision Records (ADR)
**Key technical decisions for InsurRateX**

---

## ADR-001: Hybrid Library + Framework Approach
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Need to support both developers (custom adapters) and business analysts (no-code mappings).

**Decision:**
- Library Layer: npm package for developers (@insurratex/adapter-sdk)
- Framework Layer: NestJS runtime + React UI for BAs

**Consequences:**
✅ Flexibility for complex cases (devs)
✅ Accessibility for standard cases (BAs)
⚠️ Maintain two interfaces

---

## ADR-002: Guidewire + Earnix as Primary Systems
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Need to focus on specific systems for POC.

**Decision:**
- Policy System: Guidewire PolicyCenter
- Rating Engine: Earnix
- Product Line: General Liability (GL)

**Consequences:**
✅ Clear scope for development
✅ Realistic enterprise scenario
⚠️ Other systems added later

---

## ADR-003: Local-First Development
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Balance speed of development vs production readiness.

**Decision:**
- Weeks 1-4: 100% local with Docker
- Week 5+: Deploy to AWS
- Use same Docker images everywhere

**Consequences:**
✅ Fast iteration
✅ No cloud costs initially
✅ Easy team onboarding
⚠️ Cloud migration later

---

## ADR-004: Mock Servers with Real Logic
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Need to test without enterprise licenses.

**Decision:**
- Guidewire Mock: Simple request/response (NestJS)
- Earnix Mock: Realistic rating formulas (configurable rules)

**Consequences:**
✅ No license costs for development
✅ Proves platform value (real calculations)
✅ BAs can test rule changes
⚠️ ~1000 lines of code to maintain

---

## ADR-005: TypeScript Everywhere
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Need type safety and good developer experience.

**Decision:**
- Backend: TypeScript + NestJS
- Frontend: TypeScript + React
- SDK: TypeScript + type definitions
- Schemas: JSON Schema → TypeScript (auto-generated)

**Consequences:**
✅ Type safety across stack
✅ Better IDE support
✅ Fewer runtime errors
⚠️ Learning curve for pure JS devs

---

## ADR-006: NestJS for Backend Services
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Need structured, scalable backend framework.

**Decision:**
Use NestJS for:
- Mock servers (Guidewire, Earnix)
- Orchestrator service
- Future microservices

**Alternatives Considered:**
- Express: Too minimal, need structure
- Fastify: Good performance but less ecosystem
- Koa: Similar to Express

**Consequences:**
✅ Built-in dependency injection
✅ Modular architecture
✅ Great TypeScript support
✅ Easy testing
⚠️ Slightly heavier than Express

---

## ADR-007: Docker Compose for Local Dev
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Need to run multiple services locally.

**Decision:**
Use Docker Compose with:
- guidewire-mock (port 3001)
- earnix-mock (port 4001)
- orchestrator (port 3000)
- ui (port 8080)
- postgres (port 5432, later)

**Consequences:**
✅ Single command startup
✅ Consistent environment
✅ Easy service discovery
⚠️ Need Docker Desktop

---

## ADR-008: Canonical Data Model (CDM) as JSON Schema
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Need versioned, validated data model.

**Decision:**
- Define CDM as JSON Schema
- Generate TypeScript types automatically
- Version per product line (gl-v1.2, property-v1.0)
- Base model + product extensions

**Consequences:**
✅ Single source of truth
✅ Runtime validation
✅ Auto-generated types
✅ Versioned contracts
⚠️ Schema changes require regeneration

---

## ADR-009: Mapping Configurations as JSON
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
BAs need to create/modify mappings without code.

**Decision:**
Store mappings as JSON files:
```json
{
  "id": "gw-to-cdm-gl-v1.0",
  "source": "guidewire",
  "target": "cdm",
  "version": "1.0.0",
  "mappings": [
    {
      "source": "policyNumber",
      "target": "policy.id",
      "transform": null
    }
  ]
}
```

**Consequences:**
✅ Version control friendly
✅ No code deployment for changes
✅ Easy to diff
⚠️ Need validation before use

---

## ADR-010: Rules as Configurable JSON
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Rating rules change frequently, need BA control.

**Decision:**
Three rule types, all JSON:
1. Lookup tables (CSV → JSON)
2. Decision tables (JSON)
3. Conditional rules (JSON with conditions/actions)

**Consequences:**
✅ BAs can modify without code
✅ Versioned with mappings
✅ Testable in isolation
⚠️ Complex rules may need code

---

## ADR-011: Monorepo with npm Workspaces
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Multiple packages need to work together.

**Decision:**
Use npm workspaces:
```
rating-poc/
├─ packages/
│   ├─ mocks/
│   ├─ adapter-sdk/
│   └─ cdm-schemas/
└─ apps/
    ├─ orchestrator/
    └─ ui/
```

**Alternatives Considered:**
- Lerna: Overkill for our needs
- Yarn workspaces: npm is default now
- Separate repos: Too much overhead

**Consequences:**
✅ Share code easily
✅ Single node_modules
✅ Easier dependency management
⚠️ All packages version together

---

## ADR-012: REST API (Not GraphQL)
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Need API for orchestrator.

**Decision:**
Use REST API with OpenAPI spec.

**Rationale:**
- Simpler for insurance industry
- Better tooling (Postman, Swagger)
- Easier to document
- Adapters expect REST/SOAP

**Consequences:**
✅ Industry standard
✅ Easy to document
✅ Good tooling
⚠️ May need GraphQL later for UI

---

## ADR-013: PostgreSQL for Persistence (Later)
**Date:** 2026-01-31 | **Status:** Proposed

**Context:**
Need to store mappings, rules, audit logs.

**Decision:**
Start with in-memory, migrate to PostgreSQL in Week 4.

**Schema:**
- mappings table
- rules table
- audit_log table
- mapping_versions table

**Consequences:**
✅ Relational data model fits
✅ Good JSON support
✅ Free and open source
⚠️ Need migration strategy

---

## ADR-014: No ORM Initially
**Date:** 2026-01-31 | **Status:** Accepted

**Context:**
Need to access database.

**Decision:**
Use raw SQL with prepared statements initially.
Consider TypeORM/Prisma in Week 6+ if needed.

**Rationale:**
- Start simple
- Understand queries first
- ORMs add complexity
- May not need complex relations

**Consequences:**
✅ Full control
✅ Performance visibility
⚠️ More boilerplate
⚠️ No migrations tool initially

---

## ADR-015: AI Features (Phase 2)
**Date:** 2026-01-31 | **Status:** Deferred

**Context:**
AI for mapping suggestions and NLP rules.

**Decision:**
Defer to Phase 2 (Week 8+).
Focus on core functionality first.

**Rationale:**
- Need working system first
- AI requires training data
- Complex to implement
- Not critical for POC

**Consequences:**
✅ Faster initial delivery
✅ Learn domain first
⚠️ Manual mapping initially

---

## Technology Stack Summary

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Language | TypeScript | Type safety, tooling |
| Backend Framework | NestJS | Structure, DI, testing |
| Frontend Framework | React + Vite | Component-based, fast |
| Database | PostgreSQL | Relational + JSON support |
| Container | Docker | Consistency, portability |
| Orchestration (dev) | Docker Compose | Simple local setup |
| Orchestration (prod) | ECS Fargate | AWS native, no k8s overhead |
| API Style | REST | Industry standard |
| Schemas | JSON Schema | Validation, types |
| Package Manager | npm | Default, workspaces |

---

## Architecture Patterns

### 1. Adapter Pattern
Used for policy systems and rating engines.
```typescript
interface PolicySystemAdapter {
  transformToCDM(raw: unknown): Promise<CDM>;
  transformFromCDM(cdm: CDM): Promise<unknown>;
}
```

### 2. Registry Pattern
For managing adapters and mappings.
```typescript
class AdapterRegistry {
  register(name: string, adapter: Adapter): void;
  get(name: string): Adapter;
}
```

### 3. Strategy Pattern
For different mapping strategies.
```typescript
interface MappingStrategy {
  apply(source: unknown, target: unknown): unknown;
}
```

### 4. Pipeline Pattern
For request processing.
```
Request → Adapter → CDM → Rules → Rating → Response
```

---

## System Boundaries

```
┌─────────────────────────────────────────────────────┐
│                 InsurRateX Platform                 │
│                                                       │
│  ┌───────────┐  ┌──────────┐  ┌─────────────┐     │
│  │  Adapters │→ │   CDM    │→ │   Mapping   │     │
│  └───────────┘  └──────────┘  └─────────────┘     │
│         │              │              │              │
│         ↓              ↓              ↓              │
│  ┌───────────────────────────────────────────┐     │
│  │          Orchestrator                      │     │
│  └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
         ↑                              ↓
    External                        External
    Policy                          Rating
    Systems                         Engines
```

---

## Security Considerations (Phase 2)

**Current (Development):**
- No authentication (local only)
- HTTP (no TLS)
- In-memory secrets

**Production (Week 10+):**
- OAuth 2.0 for adapters
- JWT for API authentication
- TLS everywhere
- AWS Secrets Manager
- RBAC for UI
- Audit logging

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| End-to-end latency | < 500ms (p95) | Request to response |
| Throughput | 100+ req/s | Concurrent requests |
| Memory (per service) | < 512MB | Docker stats |
| CPU (per service) | < 50% | Single core |
| Database query | < 50ms (p95) | Query execution |

---

## Monitoring Strategy (Phase 2)

**Metrics:**
- Request count, latency, errors (per endpoint)
- Mapping execution time
- Rules evaluation time
- Adapter response times

**Logging:**
- Correlation ID on all logs
- Structured JSON format
- Log levels: DEBUG, INFO, WARN, ERROR
- CloudWatch or ELK stack

**Tracing:**
- Mapping version used
- Rules applied
- Adapter called
- Full request path

---

**Last Updated:** 2026-01-31
**Version:** 1.0.0
