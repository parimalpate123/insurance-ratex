# Rating Domain - Phase-wise Implementation Plan
## From POC to Production-Ready Platform

**Version:** 1.0
**Date:** February 5, 2026
**Project Duration:** 16 weeks (4 months)
**Team Size:** 5-7 people (2 backend, 2 frontend, 1 full-stack, 1 QA, 1 product)

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 0: Foundation & Setup](#phase-0-foundation--setup)
3. [Phase 1: Configuration Infrastructure](#phase-1-configuration-infrastructure)
4. [Phase 2: Enhanced Orchestration](#phase-2-enhanced-orchestration)
5. [Phase 3: Admin UI & Wizard](#phase-3-admin-ui--wizard)
6. [Phase 4: Template Marketplace](#phase-4-template-marketplace)
7. [Phase 5: Feature Toggles & Wave Rollout](#phase-5-feature-toggles--wave-rollout)
8. [Phase 6: Testing & Production Readiness](#phase-6-testing--production-readiness)
9. [Success Metrics](#success-metrics)
10. [Risk Management](#risk-management)

---

## Overview

### Current State (Week 0)

**What We Have:**
- ✅ NestJS orchestrator service
- ✅ React mapping-ui and rules-ui
- ✅ Field catalog system (40+ insurance fields)
- ✅ Basic mapping and rule engines
- ✅ PostgreSQL database with migrations
- ✅ Docker setup
- ✅ AI-powered features (mapping generation, rule generation)

**What We're Building:**
- Configuration-driven rating platform
- Support for multiple product lines (GL, WC, Property, etc.)
- Unified admin UI with onboarding wizard
- Template marketplace
- Feature toggles and wave rollout
- Production-ready platform

### Target State (Week 16)

**Capabilities:**
- 3-4 product lines running simultaneously (GL, WC, Property, Inland Marine)
- Independent team ownership per product line
- Self-service onboarding for new product lines
- Template marketplace with 10+ templates
- Feature toggle system for gradual rollouts
- Wave-based state rollout capability
- Production deployment ready

### Architecture Strategy

**Evolution, Not Revolution:**
- Keep existing working components
- Add configuration layer on top
- Build new admin-ui alongside old UIs
- Maintain backward compatibility during transition
- Deprecate old UIs only after new ones proven

---

## Phase 0: Foundation & Setup

**Duration:** Week 1
**Team:** Full team
**Goal:** Prepare environment, align team, finalize architecture

### Tasks

#### 0.1: Project Planning (2 days)

**Activities:**
- [ ] Review and approve this implementation plan
- [ ] Set up project board (Jira, Linear, or GitHub Projects)
- [ ] Create epics for each phase
- [ ] Assign team roles and responsibilities
- [ ] Set up communication channels (Slack, meetings)

**Deliverables:**
- Project board with all epics and stories
- Team assignments document
- Communication plan
- Sprint schedule (bi-weekly sprints)

#### 0.2: Architecture Review (1 day)

**Activities:**
- [ ] Review Product Configuration Architecture document
- [ ] Finalize configuration schema
- [ ] Review API design
- [ ] Identify reusable components from existing POC

**Deliverables:**
- Approved configuration schema
- API specification document
- Reusability assessment

#### 0.3: Development Environment (2 days)

**Activities:**
- [ ] Set up development branches (feature branches from main)
- [ ] Create new docker-compose for development
- [ ] Set up local database with seed data
- [ ] Configure IDE and tooling
- [ ] Set up CI/CD pipeline basics

**Deliverables:**
- Working dev environment for all team members
- CI/CD pipeline (GitHub Actions or similar)
- Development guidelines document

### Success Criteria

- ✅ All team members have working local environment
- ✅ Project board populated with stories
- ✅ Architecture approved by team
- ✅ CI/CD pipeline running basic tests

---

## Phase 1: Configuration Infrastructure

**Duration:** Weeks 2-3 (2 weeks)
**Team:** 2 Backend + 1 Full-stack
**Goal:** Build configuration layer without breaking existing functionality

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      New Layer (ADD)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Product Line Configurations (Database + Service)     │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Existing Orchestrator (ENHANCE)                      │  │
│  │ - Add config awareness                               │  │
│  │ - Keep legacy endpoint working                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Existing Services (KEEP)                             │  │
│  │ - MappingService, RulesService, FieldCatalogService  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tasks

#### 1.1: Database Schema (Week 2, Days 1-2)

**Owner:** Backend Developer 1

**Activities:**
- [ ] Create migration `005_product_line_configuration.sql`
- [ ] Create `product_line_configs` table
- [ ] Add `product_line_code` to existing tables (mappings, rules)
- [ ] Create indexes for performance
- [ ] Seed with first product line (GL_EXISTING)

**Migration Script:**

```sql
-- File: database/migrations/005_product_line_configuration.sql

-- Create product line configurations table
CREATE TABLE product_line_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  description TEXT,
  config JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'development', 'deprecated')),
  version VARCHAR(20) DEFAULT '1.0',

  -- Ownership
  product_owner VARCHAR(255),
  technical_lead VARCHAR(255),
  team_name VARCHAR(100),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255),

  CONSTRAINT unique_active_code UNIQUE (code, status)
);

-- Add product line code to existing tables
ALTER TABLE mappings ADD COLUMN product_line_code VARCHAR(50);
ALTER TABLE rules ADD COLUMN product_line_code VARCHAR(50);

-- Create indexes
CREATE INDEX idx_product_line_configs_code ON product_line_configs(code);
CREATE INDEX idx_product_line_configs_status ON product_line_configs(status);
CREATE INDEX idx_mappings_product_line ON mappings(product_line_code);
CREATE INDEX idx_rules_product_line ON rules(product_line_code);

-- Seed first product line from existing work
INSERT INTO product_line_configs (code, name, display_name, description, config) VALUES (
  'GL_EXISTING',
  'gl-existing',
  'GL - Existing POC',
  'General Liability product line migrated from POC',
  '{
    "productLine": {
      "features": {
        "stateSupport": ["CA", "NY", "TX"],
        "territorySupport": true
      },
      "integrations": {
        "sourceSystem": {
          "name": "Guidewire PolicyCenter",
          "type": "guidewire"
        },
        "targetSystems": [
          {
            "name": "Earnix Rating Engine",
            "type": "earnix",
            "purpose": "premium_calculation"
          }
        ]
      },
      "workflow": {
        "type": "sequential",
        "steps": [
          {
            "id": "validate",
            "type": "system",
            "name": "Validate Input",
            "required": true
          },
          {
            "id": "transform",
            "type": "system",
            "name": "Execute Mappings",
            "required": true
          },
          {
            "id": "rules",
            "type": "system",
            "name": "Execute Rules",
            "required": true
          }
        ]
      },
      "api": {
        "baseEndpoint": "/api/v1/rating/gl-existing"
      }
    }
  }'::jsonb
);

-- Link existing mappings to first product line
UPDATE mappings SET product_line_code = 'GL_EXISTING' WHERE product_line_code IS NULL;

-- Link existing rules to first product line
UPDATE rules SET product_line_code = 'GL_EXISTING' WHERE product_line_code IS NULL;

-- Create configuration history table for versioning
CREATE TABLE product_line_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_line_code VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  version VARCHAR(20),
  change_description TEXT,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (product_line_code) REFERENCES product_line_configs(code)
);

CREATE INDEX idx_config_history_product_line ON product_line_config_history(product_line_code);
CREATE INDEX idx_config_history_version ON product_line_config_history(version);
```

**Testing:**
- [ ] Run migration on dev database
- [ ] Verify tables created
- [ ] Verify seed data inserted
- [ ] Verify existing mappings linked to GL_EXISTING
- [ ] Verify indexes created

**Success Criteria:**
- Migration runs successfully
- Existing data preserved and linked to GL_EXISTING
- No data loss

#### 1.2: Configuration Entity & DTOs (Week 2, Days 3-4)

**Owner:** Backend Developer 1

**Activities:**
- [ ] Create `ProductLineConfig` entity
- [ ] Create DTOs for CRUD operations
- [ ] Create configuration validation logic

**Files to Create:**

**Entity:**
```typescript
// apps/orchestrator/src/entities/product-line-config.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface ProductLineConfigJson {
  productLine: {
    features?: {
      stateSupport?: string[];
      territorySupport?: boolean;
      [key: string]: any;
    };
    integrations?: {
      sourceSystem?: any;
      targetSystems?: any[];
      webhooks?: any;
    };
    workflow?: {
      type: string;
      steps: any[];
    };
    api?: {
      baseEndpoint: string;
      endpoints?: any;
    };
    limits?: any;
    monitoring?: any;
    [key: string]: any;
  };
}

@Entity('product_line_configs')
export class ProductLineConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'display_name', length: 255, nullable: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb' })
  config: ProductLineConfigJson;

  @Column({ length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'development' | 'deprecated';

  @Column({ length: 20, default: '1.0' })
  version: string;

  @Column({ name: 'product_owner', length: 255, nullable: true })
  productOwner?: string;

  @Column({ name: 'technical_lead', length: 255, nullable: true })
  technicalLead?: string;

  @Column({ name: 'team_name', length: 100, nullable: true })
  teamName?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 255, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', length: 255, nullable: true })
  updatedBy?: string;
}
```

**DTOs:**
```typescript
// apps/orchestrator/src/dto/product-line-config.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum, IsArray } from 'class-validator';

export class CreateProductLineConfigDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsNotEmpty()
  config: any;

  @IsEnum(['active', 'inactive', 'development', 'deprecated'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  productOwner?: string;

  @IsString()
  @IsOptional()
  technicalLead?: string;

  @IsString()
  @IsOptional()
  teamName?: string;
}

export class UpdateProductLineConfigDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  config?: any;

  @IsEnum(['active', 'inactive', 'development', 'deprecated'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  productOwner?: string;

  @IsString()
  @IsOptional()
  technicalLead?: string;

  @IsString()
  @IsOptional()
  teamName?: string;
}

export class ProductLineConfigResponseDto {
  id: string;
  code: string;
  name: string;
  displayName?: string;
  description?: string;
  config: any;
  status: string;
  version: string;
  productOwner?: string;
  technicalLead?: string;
  teamName?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Testing:**
- [ ] Unit tests for entity
- [ ] Validation tests for DTOs

#### 1.3: Configuration Service (Week 2, Day 5 - Week 3, Day 1)

**Owner:** Backend Developer 2

**Activities:**
- [ ] Create `ConfigService` for CRUD operations
- [ ] Add caching for performance
- [ ] Add configuration validation logic

**Service Implementation:**

```typescript
// apps/orchestrator/src/services/config.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductLineConfig } from '../entities/product-line-config.entity';
import { CreateProductLineConfigDto, UpdateProductLineConfigDto } from '../dto/product-line-config.dto';

@Injectable()
export class ConfigService {
  private configCache: Map<string, ProductLineConfig> = new Map();
  private cacheTTL = 60000; // 60 seconds

  constructor(
    @InjectRepository(ProductLineConfig)
    private configRepository: Repository<ProductLineConfig>,
  ) {
    // Load all active configs into cache on startup
    this.loadCache();
  }

  async loadCache(): Promise<void> {
    const configs = await this.configRepository.find({
      where: { status: 'active' }
    });
    configs.forEach(config => {
      this.configCache.set(config.code, config);
    });
    console.log(`Loaded ${configs.length} product line configs into cache`);
  }

  async getProductLineConfig(code: string): Promise<ProductLineConfig> {
    // Check cache first
    if (this.configCache.has(code)) {
      const cached = this.configCache.get(code);
      return cached;
    }

    // Load from database
    const config = await this.configRepository.findOne({
      where: { code, status: 'active' }
    });

    if (!config) {
      throw new NotFoundException(`Product line configuration '${code}' not found`);
    }

    // Update cache
    this.configCache.set(code, config);

    return config;
  }

  async getAllProductLineConfigs(status?: string): Promise<ProductLineConfig[]> {
    const where = status ? { status } : {};
    return this.configRepository.find({ where });
  }

  async createProductLineConfig(
    createDto: CreateProductLineConfigDto,
    createdBy?: string
  ): Promise<ProductLineConfig> {
    // Validate configuration structure
    this.validateConfiguration(createDto.config);

    const config = this.configRepository.create({
      ...createDto,
      createdBy
    });

    const saved = await this.configRepository.save(config);

    // Update cache
    this.configCache.set(saved.code, saved);

    return saved;
  }

  async updateProductLineConfig(
    code: string,
    updateDto: UpdateProductLineConfigDto,
    updatedBy?: string
  ): Promise<ProductLineConfig> {
    const config = await this.getProductLineConfig(code);

    // Validate configuration structure if config is being updated
    if (updateDto.config) {
      this.validateConfiguration(updateDto.config);
    }

    // Save current version to history
    await this.saveConfigHistory(config);

    // Update
    Object.assign(config, updateDto);
    config.updatedBy = updatedBy;

    const updated = await this.configRepository.save(config);

    // Update cache
    this.configCache.set(code, updated);

    return updated;
  }

  async deleteProductLineConfig(code: string): Promise<void> {
    const config = await this.getProductLineConfig(code);

    // Soft delete by setting status to deprecated
    config.status = 'deprecated';
    await this.configRepository.save(config);

    // Remove from cache
    this.configCache.delete(code);
  }

  private validateConfiguration(config: any): void {
    // Validate required fields
    if (!config.productLine) {
      throw new BadRequestException('Configuration must have productLine object');
    }

    if (!config.productLine.workflow) {
      throw new BadRequestException('Configuration must have workflow definition');
    }

    if (!config.productLine.workflow.steps || !Array.isArray(config.productLine.workflow.steps)) {
      throw new BadRequestException('Workflow must have steps array');
    }

    if (config.productLine.workflow.steps.length === 0) {
      throw new BadRequestException('Workflow must have at least one step');
    }

    // Validate each step
    config.productLine.workflow.steps.forEach((step: any, index: number) => {
      if (!step.id) {
        throw new BadRequestException(`Step ${index} must have an id`);
      }
      if (!step.type) {
        throw new BadRequestException(`Step ${index} must have a type`);
      }
      if (!step.name) {
        throw new BadRequestException(`Step ${index} must have a name`);
      }
    });

    // Additional validation can be added here
  }

  private async saveConfigHistory(config: ProductLineConfig): Promise<void> {
    // Save to history table
    await this.configRepository.query(
      `INSERT INTO product_line_config_history (product_line_code, config, version, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [config.code, config.config, config.version, config.updatedBy]
    );
  }

  async getConfigHistory(code: string): Promise<any[]> {
    const result = await this.configRepository.query(
      `SELECT * FROM product_line_config_history
       WHERE product_line_code = $1
       ORDER BY changed_at DESC`,
      [code]
    );
    return result;
  }

  // Clear cache for a specific config or all
  clearCache(code?: string): void {
    if (code) {
      this.configCache.delete(code);
    } else {
      this.configCache.clear();
      this.loadCache();
    }
  }
}
```

**Testing:**
- [ ] Unit tests for all CRUD operations
- [ ] Test cache functionality
- [ ] Test validation logic
- [ ] Integration tests with database

#### 1.4: Configuration Controller (Week 3, Days 2-3)

**Owner:** Backend Developer 2

**Activities:**
- [ ] Create REST API controller
- [ ] Add authentication/authorization
- [ ] Add API documentation (Swagger)

**Controller Implementation:**

```typescript
// apps/orchestrator/src/controllers/config.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '../services/config.service';
import {
  CreateProductLineConfigDto,
  UpdateProductLineConfigDto,
  ProductLineConfigResponseDto
} from '../dto/product-line-config.dto';

@ApiTags('Product Line Configuration')
@Controller('api/v1/config/product-lines')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product line configurations' })
  @ApiResponse({ status: 200, description: 'Returns all configurations' })
  async getAllConfigs(
    @Query('status') status?: string
  ): Promise<ProductLineConfigResponseDto[]> {
    return this.configService.getAllProductLineConfigs(status);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get product line configuration by code' })
  @ApiResponse({ status: 200, description: 'Returns configuration' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getConfig(
    @Param('code') code: string
  ): Promise<ProductLineConfigResponseDto> {
    return this.configService.getProductLineConfig(code);
  }

  @Get(':code/history')
  @ApiOperation({ summary: 'Get configuration history' })
  @ApiResponse({ status: 200, description: 'Returns configuration history' })
  async getConfigHistory(
    @Param('code') code: string
  ): Promise<any[]> {
    return this.configService.getConfigHistory(code);
  }

  @Post()
  @ApiOperation({ summary: 'Create new product line configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created' })
  @ApiResponse({ status: 400, description: 'Invalid configuration' })
  @HttpCode(HttpStatus.CREATED)
  async createConfig(
    @Body() createDto: CreateProductLineConfigDto
  ): Promise<ProductLineConfigResponseDto> {
    // TODO: Get user from auth context
    return this.configService.createProductLineConfig(createDto, 'system');
  }

  @Put(':code')
  @ApiOperation({ summary: 'Update product line configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async updateConfig(
    @Param('code') code: string,
    @Body() updateDto: UpdateProductLineConfigDto
  ): Promise<ProductLineConfigResponseDto> {
    // TODO: Get user from auth context
    return this.configService.updateProductLineConfig(code, updateDto, 'system');
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete (deprecate) product line configuration' })
  @ApiResponse({ status: 204, description: 'Configuration deleted' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConfig(
    @Param('code') code: string
  ): Promise<void> {
    return this.configService.deleteProductLineConfig(code);
  }

  @Post(':code/cache/clear')
  @ApiOperation({ summary: 'Clear configuration cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared' })
  @HttpCode(HttpStatus.OK)
  async clearCache(
    @Param('code') code: string
  ): Promise<{ message: string }> {
    this.configService.clearCache(code);
    return { message: `Cache cleared for ${code}` };
  }
}
```

**Testing:**
- [ ] API integration tests for all endpoints
- [ ] Test error handling
- [ ] Test with Postman/Insomnia

#### 1.5: Module Registration (Week 3, Day 4)

**Owner:** Full-stack Developer

**Activities:**
- [ ] Register entity in TypeORM
- [ ] Register service and controller in module
- [ ] Update app.module.ts

**Module Setup:**

```typescript
// apps/orchestrator/src/modules/config.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductLineConfig } from '../entities/product-line-config.entity';
import { ConfigService } from '../services/config.service';
import { ConfigController } from '../controllers/config.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductLineConfig])
  ],
  providers: [ConfigService],
  controllers: [ConfigController],
  exports: [ConfigService]
})
export class ConfigModule {}
```

```typescript
// apps/orchestrator/src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './modules/config.module';
// ... other imports

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // ... database config
    }),
    ConfigModule,  // Add this
    // ... other modules
  ],
})
export class AppModule {}
```

**Testing:**
- [ ] Test module imports correctly
- [ ] Test API endpoints are accessible
- [ ] Test ConfigService can be injected in other services

### Deliverables for Phase 1

- ✅ Database migration (005) with product_line_configs table
- ✅ ProductLineConfig entity
- ✅ ConfigService with CRUD operations
- ✅ ConfigController with REST API
- ✅ Configuration caching mechanism
- ✅ Configuration validation logic
- ✅ Configuration history tracking
- ✅ Unit and integration tests
- ✅ API documentation (Swagger)

### Success Criteria for Phase 1

- ✅ Can create product line configuration via API
- ✅ Can retrieve configuration by code
- ✅ Can update configuration
- ✅ Configuration changes are cached
- ✅ Configuration history is tracked
- ✅ All tests passing (>90% coverage)
- ✅ Existing functionality still works (backward compatible)

### Testing Checklist

**Manual Testing:**
```bash
# 1. Create configuration
curl -X POST http://localhost:3000/api/v1/config/product-lines \
  -H "Content-Type: application/json" \
  -d '{
    "code": "GL_TEST",
    "name": "gl-test",
    "displayName": "GL Test",
    "config": {
      "productLine": {
        "workflow": {
          "steps": [
            {"id": "validate", "type": "system", "name": "Validate"}
          ]
        }
      }
    }
  }'

# 2. Get configuration
curl http://localhost:3000/api/v1/config/product-lines/GL_TEST

# 3. Update configuration
curl -X PUT http://localhost:3000/api/v1/config/product-lines/GL_TEST \
  -H "Content-Type: application/json" \
  -d '{"displayName": "GL Test Updated"}'

# 4. Get all configurations
curl http://localhost:3000/api/v1/config/product-lines

# 5. Get configuration history
curl http://localhost:3000/api/v1/config/product-lines/GL_TEST/history
```

---

## Phase 2: Enhanced Orchestration

**Duration:** Weeks 4-5 (2 weeks)
**Team:** 2 Backend + 1 QA
**Goal:** Make orchestration engine config-aware while maintaining backward compatibility

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│               Request Routing Layer                       │
│                                                            │
│  Legacy: POST /api/v1/orchestrate                        │
│    ↓                                                      │
│    Uses default product line (GL_EXISTING)               │
│                                                            │
│  New: POST /api/v1/rating/:productLineCode/execute      │
│    ↓                                                      │
│    Uses specified product line configuration             │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│           Config-Driven Orchestration Engine              │
│                                                            │
│  1. Load product line configuration                       │
│  2. Execute workflow steps from config                    │
│  3. Route to appropriate services                         │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│              Existing Services (Unchanged)                │
│  - MappingService                                         │
│  - RulesService                                           │
│  - FieldCatalogService                                    │
└──────────────────────────────────────────────────────────┘
```

### Tasks

#### 2.1: Refactor OrchestrationService (Week 4, Days 1-3)

**Owner:** Backend Developer 1

**Activities:**
- [ ] Add config-driven orchestration method
- [ ] Keep legacy orchestration method for backward compatibility
- [ ] Implement workflow executor based on config

**Service Enhancement:**

```typescript
// apps/orchestrator/src/services/orchestration.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from './config.service';
import { MappingService } from './mapping.service';
import { RulesService } from './rules.service';

export interface WorkflowContext {
  productLineCode: string;
  inputData: any;
  enrichedData: any;
  transformedData: any;
  rulesResult: any;
  finalResult: any;
  metadata: {
    startTime: number;
    endTime?: number;
    duration?: number;
    stepsExecuted: string[];
  };
}

@Injectable()
export class OrchestrationService {
  constructor(
    private configService: ConfigService,
    private mappingService: MappingService,
    private rulesService: RulesService,
  ) {}

  /**
   * Legacy method - maintained for backward compatibility
   * Delegates to config-driven method with default product line
   */
  async orchestrate(request: any): Promise<any> {
    console.log('Legacy orchestrate endpoint called - routing to GL_EXISTING');
    return this.orchestrateWithConfig('GL_EXISTING', request);
  }

  /**
   * New config-driven orchestration method
   * Executes workflow based on product line configuration
   */
  async orchestrateWithConfig(
    productLineCode: string,
    inputData: any
  ): Promise<any> {
    // Load configuration
    const config = await this.configService.getProductLineConfig(productLineCode);

    if (!config) {
      throw new NotFoundException(
        `Product line configuration '${productLineCode}' not found`
      );
    }

    // Initialize workflow context
    const context: WorkflowContext = {
      productLineCode,
      inputData,
      enrichedData: {},
      transformedData: null,
      rulesResult: null,
      finalResult: null,
      metadata: {
        startTime: Date.now(),
        stepsExecuted: []
      }
    };

    try {
      // Execute workflow steps from configuration
      const workflow = config.config.productLine.workflow;

      if (!workflow || !workflow.steps) {
        throw new Error('Invalid workflow configuration');
      }

      for (const step of workflow.steps) {
        console.log(`Executing step: ${step.id} (${step.name})`);

        context.metadata.stepsExecuted.push(step.id);

        switch (step.type) {
          case 'system':
            await this.executeSystemStep(step, context);
            break;

          case 'plugin':
            await this.executePluginStep(step, context);
            break;

          default:
            console.warn(`Unknown step type: ${step.type}`);
        }
      }

      // Finalize result
      context.finalResult = context.rulesResult || context.transformedData;
      context.metadata.endTime = Date.now();
      context.metadata.duration = context.metadata.endTime - context.metadata.startTime;

      return {
        success: true,
        productLine: productLineCode,
        result: context.finalResult,
        metadata: context.metadata
      };

    } catch (error) {
      console.error('Orchestration error:', error);

      context.metadata.endTime = Date.now();
      context.metadata.duration = context.metadata.endTime - context.metadata.startTime;

      throw {
        success: false,
        productLine: productLineCode,
        error: error.message,
        metadata: context.metadata
      };
    }
  }

  /**
   * Execute system step (built-in functionality)
   */
  private async executeSystemStep(step: any, context: WorkflowContext): Promise<void> {
    switch (step.id) {
      case 'validate':
        this.validateInput(context.inputData);
        break;

      case 'transform':
        context.transformedData = await this.mappingService.executeMapping(
          context.productLineCode,
          context.inputData
        );
        break;

      case 'rules':
        context.rulesResult = await this.rulesService.executeRules(
          context.productLineCode,
          context.transformedData || context.inputData
        );
        break;

      default:
        console.warn(`Unknown system step: ${step.id}`);
    }
  }

  /**
   * Execute plugin step (external functionality)
   */
  private async executePluginStep(step: any, context: WorkflowContext): Promise<void> {
    // Plugin execution will be implemented in Phase 4
    console.log(`Plugin step '${step.id}' - will be implemented in Phase 4`);

    // For now, just log that we would execute the plugin
    // In Phase 4, we'll load and execute actual plugins
  }

  /**
   * Validate input data
   */
  private validateInput(data: any): void {
    if (!data) {
      throw new Error('Input data is required');
    }

    // Additional validation logic can be added here
    // Could validate against JSON schema from config
  }
}
```

**Testing:**
- [ ] Unit tests for config-driven orchestration
- [ ] Test workflow execution with different configs
- [ ] Test error handling
- [ ] Test backward compatibility (legacy endpoint still works)

#### 2.2: Update MappingService (Week 4, Days 4-5)

**Owner:** Backend Developer 2

**Activities:**
- [ ] Add product line code parameter to mapping methods
- [ ] Filter mappings by product line
- [ ] Maintain backward compatibility

**Service Updates:**

```typescript
// apps/orchestrator/src/services/mapping.service.ts

@Injectable()
export class MappingService {
  constructor(
    @InjectRepository(Mapping)
    private mappingRepository: Repository<Mapping>,
    @InjectRepository(FieldMapping)
    private fieldMappingRepository: Repository<FieldMapping>,
  ) {}

  /**
   * Execute mapping for a specific product line
   */
  async executeMapping(
    productLineCode: string,
    sourceData: any
  ): Promise<any> {
    // Find mappings for this product line
    const mappings = await this.mappingRepository.find({
      where: { product_line_code: productLineCode },
      relations: ['fieldMappings']
    });

    if (!mappings || mappings.length === 0) {
      throw new NotFoundException(
        `No mappings found for product line '${productLineCode}'`
      );
    }

    // For now, use the first mapping (later we can select by source/target system)
    const mapping = mappings[0];

    // Transform data using field mappings
    const result: any = {};

    for (const fieldMapping of mapping.fieldMappings) {
      const sourceValue = this.extractValue(sourceData, fieldMapping.sourcePath);

      if (sourceValue !== undefined) {
        this.setValue(result, fieldMapping.targetPath, sourceValue);
      } else if (fieldMapping.defaultValue) {
        this.setValue(result, fieldMapping.targetPath, fieldMapping.defaultValue);
      }
    }

    return result;
  }

  /**
   * Get mappings for a product line
   */
  async getMappingsByProductLine(productLineCode: string): Promise<Mapping[]> {
    return this.mappingRepository.find({
      where: { product_line_code: productLineCode },
      relations: ['fieldMappings']
    });
  }

  /**
   * Create mapping for a product line
   */
  async createMapping(
    productLineCode: string,
    createDto: any
  ): Promise<Mapping> {
    const mapping = this.mappingRepository.create({
      ...createDto,
      product_line_code: productLineCode
    });

    return this.mappingRepository.save(mapping);
  }

  // Helper methods for extracting and setting values
  private extractValue(obj: any, path: string): any {
    // JSONPath extraction logic
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  }

  private setValue(obj: any, path: string, value: any): void {
    // Set nested value logic
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;

    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }
}
```

#### 2.3: Update RulesService (Week 5, Days 1-2)

**Owner:** Backend Developer 2

**Activities:**
- [ ] Add product line code parameter to rule methods
- [ ] Filter rules by product line
- [ ] Maintain backward compatibility

**Service Updates:**

```typescript
// apps/orchestrator/src/services/rules.service.ts

@Injectable()
export class RulesService {
  constructor(
    @InjectRepository(Rule)
    private ruleRepository: Repository<Rule>,
    @InjectRepository(RuleCondition)
    private ruleConditionRepository: Repository<RuleCondition>,
  ) {}

  /**
   * Execute rules for a specific product line
   */
  async executeRules(
    productLineCode: string,
    data: any
  ): Promise<any> {
    // Find rules for this product line
    const rules = await this.ruleRepository.find({
      where: { product_line_code: productLineCode },
      relations: ['conditions'],
      order: { priority: 'ASC' }
    });

    if (!rules || rules.length === 0) {
      console.log(`No rules found for product line '${productLineCode}', returning data as-is`);
      return data;
    }

    console.log(`Executing ${rules.length} rules for ${productLineCode}`);

    let result = { ...data };

    // Execute each rule
    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions, result)) {
        console.log(`Rule '${rule.name}' matched, applying actions`);
        result = this.applyRuleActions(rule, result);
      }
    }

    return result;
  }

  /**
   * Get rules for a product line
   */
  async getRulesByProductLine(productLineCode: string): Promise<Rule[]> {
    return this.ruleRepository.find({
      where: { product_line_code: productLineCode },
      relations: ['conditions'],
      order: { priority: 'ASC' }
    });
  }

  /**
   * Create rule for a product line
   */
  async createRule(
    productLineCode: string,
    createDto: any
  ): Promise<Rule> {
    const rule = this.ruleRepository.create({
      ...createDto,
      product_line_code: productLineCode
    });

    return this.ruleRepository.save(rule);
  }

  // Helper methods
  private evaluateConditions(conditions: RuleCondition[], data: any): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    // Evaluate all conditions (AND logic for now)
    return conditions.every(condition => this.evaluateCondition(condition, data));
  }

  private evaluateCondition(condition: RuleCondition, data: any): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue == conditionValue;
      case 'not_equals':
        return fieldValue != conditionValue;
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'contains':
        return String(fieldValue).includes(String(conditionValue));
      default:
        return false;
    }
  }

  private applyRuleActions(rule: Rule, data: any): any {
    // Apply rule actions based on rule configuration
    // This is simplified - actual implementation would be more complex
    const result = { ...data };

    if (rule.actionType && rule.actionValue) {
      switch (rule.actionType) {
        case 'set_field':
          this.setNestedValue(result, rule.actionField, rule.actionValue);
          break;
        case 'multiply':
          const currentValue = this.getNestedValue(result, rule.actionField);
          this.setNestedValue(result, rule.actionField, currentValue * rule.actionValue);
          break;
        // Add more action types as needed
      }
    }

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;

    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }
}
```

#### 2.4: Add New Routing Endpoints (Week 5, Days 3-4)

**Owner:** Backend Developer 1

**Activities:**
- [ ] Add config-driven endpoint
- [ ] Maintain legacy endpoint
- [ ] Add routing documentation

**Controller Updates:**

```typescript
// apps/orchestrator/src/controllers/orchestration.controller.ts

import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrchestrationService } from '../services/orchestration.service';

@ApiTags('Orchestration')
@Controller('api/v1')
export class OrchestrationController {
  constructor(private readonly orchestrationService: OrchestrationService) {}

  /**
   * Legacy endpoint - maintained for backward compatibility
   * Routes to GL_EXISTING product line by default
   */
  @Post('orchestrate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute rating orchestration (Legacy)',
    description: 'Legacy endpoint maintained for backward compatibility. Routes to GL_EXISTING product line.'
  })
  @ApiResponse({ status: 200, description: 'Rating executed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async orchestrate(@Body() request: any): Promise<any> {
    return this.orchestrationService.orchestrate(request);
  }

  /**
   * New config-driven endpoint
   * Executes rating for specified product line using its configuration
   */
  @Post('rating/:productLineCode/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute rating for specific product line',
    description: 'Config-driven endpoint that executes rating workflow based on product line configuration'
  })
  @ApiResponse({ status: 200, description: 'Rating executed successfully' })
  @ApiResponse({ status: 404, description: 'Product line not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async executeRating(
    @Param('productLineCode') productLineCode: string,
    @Body() request: any
  ): Promise<any> {
    return this.orchestrationService.orchestrateWithConfig(productLineCode, request);
  }

  /**
   * Test endpoint - execute with sample data
   */
  @Post('rating/:productLineCode/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test rating with sample data',
    description: 'Test product line rating with provided sample data'
  })
  async testRating(
    @Param('productLineCode') productLineCode: string,
    @Body() request: { data: any }
  ): Promise<any> {
    return this.orchestrationService.orchestrateWithConfig(productLineCode, request.data);
  }
}
```

#### 2.5: Integration Testing (Week 5, Day 5)

**Owner:** QA Engineer

**Activities:**
- [ ] Test config-driven orchestration end-to-end
- [ ] Test backward compatibility
- [ ] Performance testing
- [ ] Create test scenarios

**Test Scenarios:**

```typescript
// apps/orchestrator/test/orchestration.e2e.spec.ts

describe('Orchestration E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Legacy Endpoint', () => {
    it('should execute rating using legacy endpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orchestrate')
        .send({
          quoteNumber: 'Q-TEST-001',
          coverageLimit: 1000000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.productLine).toBe('GL_EXISTING');
    });
  });

  describe('Config-Driven Endpoint', () => {
    it('should execute rating for GL_EXISTING', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/rating/GL_EXISTING/execute')
        .send({
          quoteNumber: 'Q-TEST-002',
          coverageLimit: 1000000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.productLine).toBe('GL_EXISTING');
      expect(response.body.metadata.stepsExecuted).toContain('validate');
      expect(response.body.metadata.stepsExecuted).toContain('transform');
      expect(response.body.metadata.stepsExecuted).toContain('rules');
    });

    it('should return 404 for non-existent product line', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/rating/NON_EXISTENT/execute')
        .send({
          quoteNumber: 'Q-TEST-003',
          coverageLimit: 1000000
        })
        .expect(404);
    });

    it('should handle validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/rating/GL_EXISTING/execute')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should complete rating within 2 seconds', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/api/v1/rating/GL_EXISTING/execute')
        .send({
          quoteNumber: 'Q-PERF-001',
          coverageLimit: 1000000
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });
});
```

### Deliverables for Phase 2

- ✅ Enhanced OrchestrationService with config-driven execution
- ✅ Updated MappingService with product line filtering
- ✅ Updated RulesService with product line filtering
- ✅ New routing endpoint: POST /api/v1/rating/:productLineCode/execute
- ✅ Backward compatible legacy endpoint
- ✅ Comprehensive integration tests
- ✅ Performance tests passing
- ✅ API documentation updated

### Success Criteria for Phase 2

- ✅ Can execute rating using product line configuration
- ✅ Legacy endpoint still works (backward compatible)
- ✅ Mappings filtered by product line
- ✅ Rules filtered by product line
- ✅ Response time < 2 seconds for standard quote
- ✅ All tests passing (>90% coverage)
- ✅ Can add new product line without code changes

### Manual Testing Checklist

```bash
# 1. Test legacy endpoint (should still work)
curl -X POST http://localhost:3000/api/v1/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "quoteNumber": "Q-LEGACY-001",
    "coverageLimit": 1000000,
    "state": "CA"
  }'

# Expected: Success response with premium

# 2. Test config-driven endpoint with GL_EXISTING
curl -X POST http://localhost:3000/api/v1/rating/GL_EXISTING/execute \
  -H "Content-Type: application/json" \
  -d '{
    "quoteNumber": "Q-CONFIG-001",
    "coverageLimit": 1000000,
    "state": "CA"
  }'

# Expected: Success response with metadata showing steps executed

# 3. Test with non-existent product line
curl -X POST http://localhost:3000/api/v1/rating/INVALID/execute \
  -H "Content-Type: application/json" \
  -d '{
    "quoteNumber": "Q-INVALID-001"
  }'

# Expected: 404 error

# 4. Create a second product line configuration
curl -X POST http://localhost:3000/api/v1/config/product-lines \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WC_TEST",
    "name": "wc-test",
    "displayName": "Workers Comp Test",
    "config": {
      "productLine": {
        "workflow": {
          "type": "sequential",
          "steps": [
            {"id": "validate", "type": "system", "name": "Validate Input", "required": true},
            {"id": "transform", "type": "system", "name": "Execute Mappings", "required": true}
          ]
        },
        "api": {
          "baseEndpoint": "/api/v1/rating/wc-test"
        }
      }
    }
  }'

# 5. Test rating with WC_TEST product line
curl -X POST http://localhost:3000/api/v1/rating/WC_TEST/execute \
  -H "Content-Type: application/json" \
  -d '{
    "quoteNumber": "Q-WC-001",
    "payroll": 500000
  }'

# Expected: Success (even without mappings/rules, validation and transform steps should execute)
```

---

## Phase 3: Admin UI & Wizard

**Duration:** Weeks 6-9 (4 weeks)
**Team:** 2 Frontend + 1 Backend + 1 Full-stack
**Goal:** Build unified admin UI with onboarding wizard

### Overview

Create new admin-ui application that replaces mapping-ui and rules-ui with:
- Unified interface
- Product line selector
- Onboarding wizard for first product
- Self-service quick-add for subsequent products
- Configuration management UI

### Tasks

#### 3.1: Project Setup (Week 6, Days 1-2)

**Owner:** Frontend Developer 1

**Activities:**
- [ ] Create new React + Vite project
- [ ] Set up project structure
- [ ] Install dependencies
- [ ] Configure routing
- [ ] Set up styling (Tailwind CSS)

**Commands:**
```bash
cd apps/
npm create vite@latest admin-ui -- --template react-ts
cd admin-ui
npm install

# Install dependencies
npm install react-router-dom @tanstack/react-query axios
npm install lucide-react  # Icons
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Set up proxy for API calls
# Update vite.config.ts
```

**Project Structure:**
```
apps/admin-ui/
├── src/
│   ├── api/              # API client functions
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts (DomainContext, etc.)
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── ProductLines.tsx
│   │   ├── wizard/       # Onboarding wizard
│   │   ├── mappings/     # Mapping management
│   │   ├── rules/        # Rule management
│   │   └── settings/     # Settings
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

#### 3.2: Core Components & Layout (Week 6, Days 3-5)

**Owner:** Frontend Developer 2

**Activities:**
- [ ] Create Layout component with header and navigation
- [ ] Create ProductLineSelector component
- [ ] Create Dashboard page
- [ ] Set up routing

**Key Components:**

**Layout:**
```typescript
// src/components/Layout.tsx

import { Outlet, Link, useLocation } from 'react-router-dom';
import { Map, Home, Layers, FileText, Settings } from 'lucide-react';
import { ProductLineSelector } from './ProductLineSelector';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Map className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">InsurRateX</h1>
                <p className="text-xs text-gray-500">Rating Platform</p>
              </div>
            </div>

            {/* Product Line Selector */}
            <ProductLineSelector />

            {/* Navigation */}
            <nav className="flex space-x-4">
              <Link
                to="/"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/product-lines"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/product-lines')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Product Lines</span>
              </Link>

              <Link
                to="/mappings"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/mappings')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Mappings</span>
              </Link>

              <Link
                to="/settings"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/settings')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

**Product Line Selector:**
```typescript
// src/components/ProductLineSelector.tsx

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getProductLineConfigs } from '../api/config';

export function ProductLineSelector() {
  const [productLines, setProductLines] = useState([]);
  const [selectedProductLine, setSelectedProductLine] = useState('ALL');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadProductLines();
  }, []);

  const loadProductLines = async () => {
    try {
      const configs = await getProductLineConfigs();
      setProductLines(configs);
    } catch (error) {
      console.error('Failed to load product lines:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <span className="text-sm font-medium text-gray-700">
          {selectedProductLine === 'ALL'
            ? 'All Product Lines'
            : productLines.find(pl => pl.code === selectedProductLine)?.displayName || selectedProductLine
          }
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={() => {
                setSelectedProductLine('ALL');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              All Product Lines
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            {productLines.map((pl) => (
              <button
                key={pl.code}
                onClick={() => {
                  setSelectedProductLine(pl.code);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {pl.displayName || pl.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 3.3: Onboarding Wizard (Week 7, Days 1-5)

**Owner:** Frontend Developer 1 + Frontend Developer 2

**Activities:**
- [ ] Create wizard component with 5 steps
- [ ] Implement wizard navigation and state management
- [ ] Connect to backend APIs
- [ ] Add validation and error handling

**Wizard Implementation:**

```typescript
// src/pages/wizard/OnboardingWizard.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createProductLineConfig } from '../../api/config';
import { Step1ProductDetails } from './Step1ProductDetails';
import { Step2SystemConnections } from './Step2SystemConnections';
import { Step3TemplateSelection } from './Step3TemplateSelection';
import { Step4ConfigurationReview } from './Step4ConfigurationReview';
import { Step5TestAndDeploy } from './Step5TestAndDeploy';

interface WizardData {
  // Step 1
  code: string;
  name: string;
  displayName: string;
  description: string;
  states: string[];
  productOwner: string;
  technicalLead: string;

  // Step 2
  sourceSystem: {
    type: string;
    name: string;
    apiUrl: string;
    credentials: any;
  };
  targetSystems: Array<{
    type: string;
    name: string;
    apiUrl: string;
    credentials: any;
  }>;

  // Step 3
  template?: {
    id: string;
    name: string;
    config: any;
  };

  // Step 4 & 5
  finalConfig: any;
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    code: '',
    name: '',
    displayName: '',
    description: '',
    states: [],
    productOwner: '',
    technicalLead: '',
    sourceSystem: null,
    targetSystems: [],
    template: null,
    finalConfig: null
  });

  const createMutation = useMutation({
    mutationFn: createProductLineConfig,
    onSuccess: (data) => {
      navigate(`/product-lines/${data.code}`);
    },
    onError: (error) => {
      console.error('Failed to create product line:', error);
    }
  });

  const handleNext = (stepData: any) => {
    setWizardData({ ...wizardData, ...stepData });
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSkipWizard = () => {
    navigate('/product-lines/new');
  };

  const handleFinish = async (finalData: any) => {
    const config = buildConfiguration(wizardData, finalData);
    await createMutation.mutateAsync(config);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : step < currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 5 && (
                <div
                  className={`w-24 h-1 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs">Product Details</span>
          <span className="text-xs">Systems</span>
          <span className="text-xs">Template</span>
          <span className="text-xs">Review</span>
          <span className="text-xs">Deploy</span>
        </div>
      </div>

      {/* Wizard Steps */}
      <div className="bg-white rounded-lg shadow p-6">
        {currentStep === 1 && (
          <Step1ProductDetails
            data={wizardData}
            onNext={handleNext}
            onSkip={handleSkipWizard}
          />
        )}

        {currentStep === 2 && (
          <Step2SystemConnections
            data={wizardData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <Step3TemplateSelection
            data={wizardData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <Step4ConfigurationReview
            data={wizardData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 5 && (
          <Step5TestAndDeploy
            data={wizardData}
            onFinish={handleFinish}
            onBack={handleBack}
            isLoading={createMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

function buildConfiguration(wizardData: WizardData, finalData: any): any {
  return {
    code: wizardData.code,
    name: wizardData.name,
    displayName: wizardData.displayName,
    description: wizardData.description,
    productOwner: wizardData.productOwner,
    technicalLead: wizardData.technicalLead,
    config: {
      productLine: {
        features: {
          stateSupport: wizardData.states
        },
        integrations: {
          sourceSystem: wizardData.sourceSystem,
          targetSystems: wizardData.targetSystems
        },
        workflow: wizardData.template?.config?.workflow || {
          type: 'sequential',
          steps: [
            { id: 'validate', type: 'system', name: 'Validate Input', required: true },
            { id: 'transform', type: 'system', name: 'Execute Mappings', required: true },
            { id: 'rules', type: 'system', name: 'Execute Rules', required: true }
          ]
        },
        api: {
          baseEndpoint: `/api/v1/rating/${wizardData.name}`
        }
      }
    }
  };
}
```

**Individual Step Components:**

**Step 1: Product Details**
```typescript
// src/pages/wizard/Step1ProductDetails.tsx

export function Step1ProductDetails({ data, onNext, onSkip }) {
  const [formData, setFormData] = useState({
    code: data.code || '',
    name: data.name || '',
    displayName: data.displayName || '',
    description: data.description || '',
    states: data.states || [],
    productOwner: data.productOwner || '',
    technicalLead: data.technicalLead || ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.displayName) newErrors.displayName = 'Display name is required';
    if (!formData.name) newErrors.name = 'Name is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Auto-generate code from name
    const code = formData.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    onNext({ ...formData, code });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-6">Step 1: Product Details</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name *
          </label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g., GL Commercial"
          />
          {errors.displayName && (
            <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Internal Name * (lowercase, no spaces)
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g., gl-commercial"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="e.g., General liability coverage for commercial businesses"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supported States
          </label>
          <div className="grid grid-cols-5 gap-2">
            {['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'].map((state) => (
              <label key={state} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.states.includes(state)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, states: [...formData.states, state] });
                    } else {
                      setFormData({
                        ...formData,
                        states: formData.states.filter(s => s !== state)
                      });
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">{state}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Owner
            </label>
            <input
              type="email"
              value={formData.productOwner}
              onChange={(e) => setFormData({ ...formData, productOwner: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="email@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technical Lead
            </label>
            <input
              type="email"
              value={formData.technicalLead}
              onChange={(e) => setFormData({ ...formData, technicalLead: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="email@company.com"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          Skip Wizard (Configure Manually)
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Next: System Connections
        </button>
      </div>
    </form>
  );
}
```

#### 3.4: Configuration Management UI (Week 8, Days 1-3)

**Owner:** Frontend Developer 2

**Activities:**
- [ ] Create product line list page
- [ ] Create product line detail page
- [ ] Create configuration editor
- [ ] Add export/import functionality

**Product Lines Page:**
```typescript
// src/pages/ProductLines.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Settings, Eye, Trash2 } from 'lucide-react';
import { getProductLineConfigs } from '../api/config';

export default function ProductLines() {
  const { data: productLines = [], isLoading } = useQuery({
    queryKey: ['product-lines'],
    queryFn: getProductLineConfigs
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Lines</h1>
        <Link
          to="/product-lines/wizard"
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product Line</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productLines.map((pl) => (
          <div key={pl.code} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{pl.displayName}</h3>
                <p className="text-sm text-gray-500">{pl.code}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  pl.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {pl.status}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-4">{pl.description}</p>

            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <span>States: {pl.config.productLine.features?.stateSupport?.length || 0}</span>
              <span>•</span>
              <span>v{pl.version}</span>
            </div>

            <div className="flex space-x-2">
              <Link
                to={`/product-lines/${pl.code}`}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
                <span>View</span>
              </Link>
              <Link
                to={`/product-lines/${pl.code}/edit`}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                <span>Configure</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 3.5: Copy Existing Features (Week 8, Days 4-5; Week 9)

**Owner:** Full-stack Developer + Both Frontend Developers

**Activities:**
- [ ] Copy field catalog components from mapping-ui
- [ ] Copy mapping editor from mapping-ui
- [ ] Copy rule builder from rules-ui
- [ ] Update all to work with product line context
- [ ] Add domain filtering

**Strategy:**
1. Copy components as-is first
2. Update API calls to include product line code
3. Test with existing GL_EXISTING product line
4. Gradually enhance and improve

### Deliverables for Phase 3

- ✅ New admin-ui application
- ✅ Layout with product line selector
- ✅ Dashboard page
- ✅ 5-step onboarding wizard
- ✅ Product lines management page
- ✅ Configuration editor
- ✅ Migrated field catalog features
- ✅ Migrated mapping features
- ✅ Migrated rule features
- ✅ All features work with product line context

### Success Criteria for Phase 3

- ✅ Can complete wizard in < 10 minutes
- ✅ Wizard creates valid product line configuration
- ✅ Can switch between product lines in UI
- ✅ Mappings filtered by selected product line
- ✅ Rules filtered by selected product line
- ✅ All existing features work in new UI
- ✅ Old UIs (mapping-ui, rules-ui) still work

---

## Phase 4: Template Marketplace

**Duration:** Weeks 10-11 (2 weeks)
**Team:** 1 Backend + 1 Frontend + 1 Full-stack
**Goal:** Build template system for sharing configurations

### Tasks

#### 4.1: Template Storage (Week 10, Days 1-2)

**Owner:** Backend Developer 1

**Activities:**
- [ ] Create templates database schema
- [ ] Create Template entity and service
- [ ] Create template export/import functionality

**Migration:**

```sql
-- File: database/migrations/006_templates.sql

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  description TEXT,
  category VARCHAR(100),

  -- Template content
  template_config JSONB NOT NULL,

  -- Metadata
  author VARCHAR(255),
  version VARCHAR(20) DEFAULT '1.0',
  status VARCHAR(20) DEFAULT 'active',

  -- Usage stats
  install_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,

  -- Compatibility
  compatible_source_systems TEXT[],
  compatible_target_systems TEXT[],
  supported_product_types TEXT[],

  -- Publishing
  is_public BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),

  CONSTRAINT check_rating CHECK (rating_average >= 0 AND rating_average <= 5)
);

-- Template reviews
CREATE TABLE template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reviewer_name VARCHAR(255),
  reviewer_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Template installations (tracking)
CREATE TABLE template_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  product_line_code VARCHAR(50) REFERENCES product_line_configs(code),
  installed_at TIMESTAMP DEFAULT NOW(),
  installed_by VARCHAR(255)
);

-- Indexes
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_templates_public ON templates(is_public);
CREATE INDEX idx_template_reviews_template ON template_reviews(template_id);

-- Seed some templates
INSERT INTO templates (code, name, display_name, description, category, template_config, author, is_public, is_verified) VALUES
(
  'GL_GW_EARNIX',
  'gl-guidewire-earnix',
  'GL - Guidewire to Earnix',
  'General Liability rating integration between Guidewire PolicyCenter and Earnix Rating Engine',
  'rating',
  '{
    "mappings": {
      "count": 47,
      "fields": []
    },
    "rules": {
      "count": 23,
      "rules": []
    },
    "workflow": {
      "type": "sequential",
      "steps": [
        {"id": "validate", "type": "system", "name": "Validate Input", "required": true},
        {"id": "transform", "type": "system", "name": "Execute Mappings", "required": true},
        {"id": "rules", "type": "system", "name": "Execute Rules", "required": true}
      ]
    }
  }'::jsonb,
  'InsurRateX Team',
  true,
  true
);
```

#### 4.2: Template Service & API (Week 10, Days 3-5)

**Owner:** Backend Developer 1

**Activities:**
- [ ] Create TemplateService
- [ ] Create TemplateController
- [ ] Add export functionality (product line → template)
- [ ] Add import functionality (template → product line)

**Service:**

```typescript
// apps/orchestrator/src/services/template.service.ts

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
    @InjectRepository(ProductLineConfig)
    private configRepository: Repository<ProductLineConfig>,
  ) {}

  async findAllTemplates(filters?: {
    category?: string;
    sourceSystem?: string;
    targetSystem?: string;
    search?: string;
  }): Promise<Template[]> {
    const query = this.templateRepository.createQueryBuilder('template');

    query.where('template.is_public = :isPublic', { isPublic: true });
    query.andWhere('template.status = :status', { status: 'active' });

    if (filters?.category) {
      query.andWhere('template.category = :category', { category: filters.category });
    }

    if (filters?.search) {
      query.andWhere(
        '(template.name ILIKE :search OR template.display_name ILIKE :search OR template.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return query.orderBy('template.install_count', 'DESC').getMany();
  }

  async installTemplate(
    templateId: string,
    productLineCode: string,
    customizations?: any
  ): Promise<ProductLineConfig> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId }
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    // Create product line config from template
    const config = this.configRepository.create({
      code: productLineCode,
      name: productLineCode.toLowerCase(),
      config: template.templateConfig,
      ...customizations
    });

    const saved = await this.configRepository.save(config);

    // Track installation
    await this.trackInstallation(templateId, productLineCode);

    // Increment install count
    await this.templateRepository.increment(
      { id: templateId },
      'installCount',
      1
    );

    return saved;
  }

  async exportAsTemplate(
    productLineCode: string,
    templateData: {
      name: string;
      displayName: string;
      description: string;
      category: string;
      isPublic: boolean;
    }
  ): Promise<Template> {
    const config = await this.configRepository.findOne({
      where: { code: productLineCode }
    });

    if (!config) {
      throw new NotFoundException(`Product line ${productLineCode} not found`);
    }

    const template = this.templateRepository.create({
      code: `TPL_${templateData.name.toUpperCase()}`,
      name: templateData.name,
      displayName: templateData.displayName,
      description: templateData.description,
      category: templateData.category,
      templateConfig: config.config,
      isPublic: templateData.isPublic,
      author: config.createdBy || 'Unknown'
    });

    return this.templateRepository.save(template);
  }

  private async trackInstallation(
    templateId: string,
    productLineCode: string
  ): Promise<void> {
    await this.templateRepository.query(
      `INSERT INTO template_installations (template_id, product_line_code, installed_by)
       VALUES ($1, $2, $3)`,
      [templateId, productLineCode, 'system']
    );
  }
}
```

#### 4.3: Template Browser UI (Week 11, Days 1-3)

**Owner:** Frontend Developer 1

**Activities:**
- [ ] Create template marketplace page
- [ ] Add search and filtering
- [ ] Template detail modal
- [ ] Installation flow

```typescript
// src/pages/TemplateMarketplace.tsx

export default function TemplateMarketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');

  const { data: templates = [] } = useQuery({
    queryKey: ['templates', category, searchTerm],
    queryFn: () => getTemplates({ category, search: searchTerm })
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Template Marketplace</h1>

      {/* Search and Filters */}
      <div className="mb-6 flex space-x-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search templates..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Categories</option>
          <option value="rating">Rating</option>
          <option value="policy">Policy</option>
          <option value="billing">Billing</option>
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">{template.displayName}</h3>
          {template.isVerified && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              Verified
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">{template.description}</p>

        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 mr-1" />
            <span>{template.ratingAverage?.toFixed(1) || 'N/A'}</span>
          </div>
          <span>{template.installCount} installs</span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(true)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Preview
          </button>
          <button
            onClick={() => handleInstall(template.id)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Install
          </button>
        </div>
      </div>

      {showDetails && (
        <TemplateDetailModal
          template={template}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}
```

### Deliverables for Phase 4

- ✅ Template database schema
- ✅ TemplateService with CRUD operations
- ✅ Template export from product line
- ✅ Template import to create product line
- ✅ Template marketplace UI
- ✅ Template installation flow
- ✅ 3-5 seed templates

### Success Criteria for Phase 4

- ✅ Can browse templates in marketplace
- ✅ Can preview template details
- ✅ Can install template to create new product line
- ✅ Can export existing product line as template
- ✅ Templates have ratings and reviews
- ✅ Installation completes in < 30 seconds

---

## Phase 5: Feature Toggles & Wave Rollout

**Duration:** Weeks 12-13 (2 weeks)
**Team:** 1 Backend + 1 Frontend + 1 Full-stack
**Goal:** Implement feature toggle and wave rollout system

### Tasks

#### 5.1: Feature Toggle Infrastructure (Week 12, Days 1-3)

**Owner:** Backend Developer 2

**Migration:**

```sql
-- File: database/migrations/007_feature_toggles.sql

CREATE TABLE feature_toggles (
  toggle_key VARCHAR(100) PRIMARY KEY,
  toggle_name VARCHAR(255) NOT NULL,
  toggle_type VARCHAR(50) NOT NULL CHECK (toggle_type IN ('kill_switch', 'release', 'experiment', 'ops')),

  product_line_code VARCHAR(50) REFERENCES product_line_configs(code),

  -- Enablement
  enabled_globally BOOLEAN DEFAULT false,
  enabled_states TEXT[],
  enabled_product_lines TEXT[],
  percentage_rollout INTEGER DEFAULT 100 CHECK (percentage_rollout >= 0 AND percentage_rollout <= 100),

  -- Configuration
  config JSONB,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

-- Wave rollout configurations
CREATE TABLE wave_rollouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_toggle_key VARCHAR(100) REFERENCES feature_toggles(toggle_key),

  wave_number INTEGER NOT NULL,
  wave_name VARCHAR(255),
  states TEXT[],
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'paused', 'cancelled')),

  -- Monitoring
  success_criteria JSONB,
  metrics JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Toggle evaluation logs (for analytics)
CREATE TABLE toggle_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toggle_key VARCHAR(100),
  evaluated_at TIMESTAMP DEFAULT NOW(),
  state VARCHAR(10),
  product_line VARCHAR(50),
  result BOOLEAN,
  context JSONB
);

-- Indexes
CREATE INDEX idx_toggles_product_line ON feature_toggles(product_line_code);
CREATE INDEX idx_toggles_enabled ON feature_toggles(enabled_globally);
CREATE INDEX idx_wave_rollouts_toggle ON wave_rollouts(feature_toggle_key);
CREATE INDEX idx_wave_rollouts_status ON wave_rollouts(status);
CREATE INDEX idx_toggle_evaluations_key ON toggle_evaluations(toggle_key);
CREATE INDEX idx_toggle_evaluations_date ON toggle_evaluations(evaluated_at);
```

#### 5.2: Toggle Service (Week 12, Days 4-5)

**Owner:** Backend Developer 2

```typescript
// apps/orchestrator/src/services/feature-toggle.service.ts

@Injectable()
export class FeatureToggleService {
  constructor(
    @InjectRepository(FeatureToggle)
    private toggleRepository: Repository<FeatureToggle>,
  ) {}

  async isFeatureEnabled(
    toggleKey: string,
    context: {
      state?: string;
      productLine?: string;
      userId?: string;
    }
  ): Promise<boolean> {
    const toggle = await this.toggleRepository.findOne({
      where: { toggleKey }
    });

    if (!toggle || !toggle.enabledGlobally) {
      await this.logEvaluation(toggleKey, context, false);
      return false;
    }

    // Check expiration
    if (toggle.expiresAt && new Date(toggle.expiresAt) < new Date()) {
      await this.logEvaluation(toggleKey, context, false);
      return false;
    }

    // Check state filter
    if (toggle.enabledStates && toggle.enabledStates.length > 0) {
      if (!context.state || !toggle.enabledStates.includes(context.state)) {
        await this.logEvaluation(toggleKey, context, false);
        return false;
      }
    }

    // Check product line filter
    if (toggle.enabledProductLines && toggle.enabledProductLines.length > 0) {
      if (!context.productLine || !toggle.enabledProductLines.includes(context.productLine)) {
        await this.logEvaluation(toggleKey, context, false);
        return false;
      }
    }

    // Check percentage rollout
    if (toggle.percentageRollout < 100 && context.userId) {
      const hash = this.hashUserId(context.userId, toggleKey);
      if (hash % 100 >= toggle.percentageRollout) {
        await this.logEvaluation(toggleKey, context, false);
        return false;
      }
    }

    await this.logEvaluation(toggleKey, context, true);
    return true;
  }

  private hashUserId(userId: string, toggleKey: string): number {
    const str = `${userId}-${toggleKey}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private async logEvaluation(
    toggleKey: string,
    context: any,
    result: boolean
  ): Promise<void> {
    // Log to database for analytics (async, non-blocking)
    setImmediate(async () => {
      try {
        await this.toggleRepository.query(
          `INSERT INTO toggle_evaluations (toggle_key, state, product_line, result, context)
           VALUES ($1, $2, $3, $4, $5)`,
          [toggleKey, context.state, context.productLine, result, JSON.stringify(context)]
        );
      } catch (error) {
        console.error('Failed to log toggle evaluation:', error);
      }
    });
  }
}
```

#### 5.3: Toggle UI (Week 13, Days 1-3)

**Owner:** Frontend Developer 2

```typescript
// src/pages/FeatureToggles.tsx

export default function FeatureToggles() {
  const { data: toggles = [] } = useQuery({
    queryKey: ['feature-toggles'],
    queryFn: getFeatureToggles
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Feature Toggles</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
          Create Toggle
        </button>
      </div>

      <div className="space-y-4">
        {toggles.map((toggle) => (
          <ToggleCard key={toggle.toggleKey} toggle={toggle} />
        ))}
      </div>
    </div>
  );
}

function ToggleCard({ toggle }) {
  const [enabled, setEnabled] = useState(toggle.enabledGlobally);

  const handleToggle = async () => {
    await updateToggle(toggle.toggleKey, { enabledGlobally: !enabled });
    setEnabled(!enabled);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{toggle.toggleName}</h3>
          <p className="text-sm text-gray-500">{toggle.toggleKey}</p>
        </div>

        <button
          onClick={handleToggle}
          className={`px-4 py-2 rounded-md ${
            enabled
              ? 'bg-green-600 text-white'
              : 'bg-gray-300 text-gray-700'
          }`}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Type:</span>
          <span className="ml-2 font-medium">{toggle.toggleType}</span>
        </div>
        <div>
          <span className="text-gray-600">States:</span>
          <span className="ml-2 font-medium">
            {toggle.enabledStates?.length || 0}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Rollout:</span>
          <span className="ml-2 font-medium">{toggle.percentageRollout}%</span>
        </div>
      </div>
    </div>
  );
}
```

### Deliverables for Phase 5

- ✅ Feature toggle database schema
- ✅ FeatureToggleService with evaluation logic
- ✅ Toggle management UI
- ✅ Wave rollout configuration
- ✅ Toggle analytics dashboard
- ✅ Integration with orchestration engine

### Success Criteria for Phase 5

- ✅ Can create feature toggle via UI
- ✅ Can enable/disable toggle instantly
- ✅ Toggle evaluation < 1ms
- ✅ State-based filtering works
- ✅ Percentage rollout works
- ✅ Wave rollout can be configured
- ✅ Analytics show toggle usage

---

## Phase 6: Testing & Production Readiness

**Duration:** Weeks 14-16 (3 weeks)
**Team:** Full team
**Goal:** Comprehensive testing and production deployment preparation

### Week 14: Integration & E2E Testing

**Tasks:**
- [ ] End-to-end test scenarios (20+ scenarios)
- [ ] Performance testing (load testing)
- [ ] Security testing
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing

### Week 15: Documentation & Training

**Tasks:**
- [ ] User documentation
- [ ] API documentation (complete Swagger)
- [ ] Admin guide
- [ ] Developer guide for custom plugins
- [ ] Video tutorials (5-10 videos)
- [ ] Internal team training

### Week 16: Production Deployment

**Tasks:**
- [ ] Set up production environment
- [ ] Configure monitoring and alerting
- [ ] Set up backup and disaster recovery
- [ ] Deploy to production
- [ ] Smoke testing in production
- [ ] Go-live communication

### Deliverables for Phase 6

- ✅ 50+ automated E2E tests
- ✅ Performance test results (target: <2s response time)
- ✅ Security audit completed
- ✅ Complete documentation
- ✅ Training materials
- ✅ Production environment ready
- ✅ Monitoring dashboards
- ✅ Incident response plan

### Success Criteria for Phase 6

- ✅ All tests passing (E2E, integration, unit)
- ✅ Performance meets targets (<2s for 95th percentile)
- ✅ No critical security vulnerabilities
- ✅ Documentation complete and reviewed
- ✅ Team trained on all features
- ✅ Production deployment successful
- ✅ Zero critical bugs in first week of production

---

## Success Metrics

### Development Metrics

- **Velocity:** Complete phases on time (±1 week acceptable)
- **Quality:** >90% test coverage across all modules
- **Performance:** <2 seconds for rating execution
- **Bugs:** <5 critical bugs per phase

### Product Metrics

- **Time to Deploy:** New product line in <2 days (with template)
- **Template Usage:** 80% of product lines start from template
- **User Adoption:** 10+ product lines configured in first month
- **Feature Toggle Usage:** 5+ toggles actively used

### Business Metrics

- **Cost Reduction:** 80% reduction in implementation cost
- **Team Efficiency:** 1-2 people can manage 10+ product lines
- **Time to Market:** 4 weeks vs. 6 months traditional approach

---

## Risk Management

### Technical Risks

**Risk 1: Performance Degradation**
- **Probability:** Medium
- **Impact:** High
- **Mitigation:**
  - Load testing in Phase 6
  - Database query optimization
  - Caching strategy (configuration cache, toggle cache)
  - Monitoring and alerting
- **Contingency:** Rollback plan, performance optimization sprint

**Risk 2: Data Migration Issues**
- **Probability:** Medium
- **Impact:** High
- **Mitigation:**
  - Test migrations on copy of production data
  - Rollback scripts for all migrations
  - Backup before migration
- **Contingency:** Restore from backup, fix migration, retry

**Risk 3: Backward Compatibility Breaking**
- **Probability:** Low
- **Impact:** High
- **Mitigation:**
  - Maintain legacy endpoints throughout
  - Comprehensive regression testing
  - Gradual deprecation with warnings
- **Contingency:** Keep old UIs running, extend deprecation timeline

### Schedule Risks

**Risk 4: Phase Delays**
- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Buffer week built into timeline
  - Weekly progress reviews
  - Early identification of blockers
- **Contingency:** Descope non-critical features, extend timeline by 2 weeks

**Risk 5: Resource Unavailability**
- **Probability:** Low
- **Impact:** High
- **Mitigation:**
  - Cross-training team members
  - Documentation for knowledge transfer
  - Pair programming for critical components
- **Contingency:** Adjust assignments, bring in additional resources

### Adoption Risks

**Risk 6: User Resistance to New UI**
- **Probability:** Low
- **Impact:** Medium
- **Mitigation:**
  - Early user involvement
  - Training and documentation
  - Keep old UIs available during transition
- **Contingency:** Extended transition period, more training

---

## Appendix

### Team Roles & Responsibilities

**Backend Developer 1:**
- Configuration infrastructure (Phase 1)
- Orchestration enhancement (Phase 2)
- Template system (Phase 4)

**Backend Developer 2:**
- Service refactoring (Phase 2)
- Feature toggles (Phase 5)
- Performance optimization (Phase 6)

**Frontend Developer 1:**
- Admin UI setup (Phase 3)
- Onboarding wizard (Phase 3)
- Template marketplace UI (Phase 4)

**Frontend Developer 2:**
- UI components (Phase 3)
- Configuration UI (Phase 3)
- Feature toggle UI (Phase 5)

**Full-stack Developer:**
- Integration work across phases
- API documentation
- Testing coordination

**QA Engineer:**
- Test plan creation
- Test execution (all phases)
- Automation scripts
- Performance testing (Phase 6)

**Product Manager:**
- Requirements clarification
- Priority decisions
- User acceptance testing
- Go-live coordination

### Communication Plan

**Daily:**
- 15-minute standup (9:00 AM)
- Slack updates on blockers

**Weekly:**
- Sprint planning (Monday 10:00 AM)
- Sprint review/demo (Friday 2:00 PM)
- Retrospective (Friday 3:00 PM)

**Bi-weekly:**
- Stakeholder demo
- Progress report to leadership

### Tools & Infrastructure

**Development:**
- Git for version control
- GitHub for repository
- Docker for containerization
- VS Code recommended IDE

**Project Management:**
- Jira/Linear for task tracking
- Confluence/Notion for documentation
- Slack for communication

**Testing:**
- Jest for unit tests
- Supertest for API tests
- Playwright for E2E tests
- K6 for load testing

**Deployment:**
- GitHub Actions for CI/CD
- Docker Compose for local dev
- Kubernetes for production (future)

---

## Timeline Summary

```
Week 1:  Phase 0 - Foundation & Setup
Week 2-3:  Phase 1 - Configuration Infrastructure
Week 4-5:  Phase 2 - Enhanced Orchestration
Week 6-9:  Phase 3 - Admin UI & Wizard
Week 10-11: Phase 4 - Template Marketplace
Week 12-13: Phase 5 - Feature Toggles & Wave Rollout
Week 14-16: Phase 6 - Testing & Production Readiness

Total: 16 weeks (4 months)
```

### Milestones

- **Week 3:** Configuration system operational
- **Week 5:** Config-driven orchestration working
- **Week 9:** Admin UI MVP complete
- **Week 11:** First 3 templates available
- **Week 13:** Feature toggles operational
- **Week 16:** Production go-live

---

**END OF IMPLEMENTATION PLAN**

---

## Next Steps

To begin implementation:

1. **This Week:**
   - Review and approve this plan
   - Set up project board
   - Assign team members
   - Create Phase 0 tasks

2. **Week 1 (Phase 0):**
   - Environment setup
   - Architecture review
   - Development guidelines
   - CI/CD pipeline

3. **Week 2 (Phase 1 Start):**
   - Create migration 005
   - Build ProductLineConfig entity
   - Start ConfigService implementation

**Ready to begin?**
