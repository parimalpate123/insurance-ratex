/**
 * Shared TypeScript types for Product Line Configuration
 * Used across rating-api backend and admin-ui frontend
 */

export type ConfigStatus = 'active' | 'inactive' | 'draft' | 'archived';

export interface IntegrationConfig {
  type: string;
  version?: string;
  endpoint: string;
  authentication: 'oauth2' | 'api_key' | 'basic' | 'none';
  config?: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  type: 'system' | 'plugin' | 'custom';
  name: string;
  enabled: boolean;
  pluginId?: string;
  config?: Record<string, any>;
}

export interface ProductLineConfiguration {
  productLine: {
    code: string;
    name: string;
    displayName: string;
    industry: string;
    states: string[];
  };
  integrations: {
    sourceSystem: IntegrationConfig;
    targetSystems: IntegrationConfig[];
  };
  workflow: {
    steps: WorkflowStep[];
  };
  features: {
    dataMapping?: {
      enabled: boolean;
      aiAssisted?: boolean;
    };
    businessRules?: {
      enabled: boolean;
      aiGeneration?: boolean;
    };
    multiStateSupport?: {
      enabled: boolean;
      states: string[];
    };
    customPlugins?: {
      enabled: boolean;
    };
    [key: string]: any;
  };
  api: {
    baseEndpoint: string;
    methods: string[];
    authentication: string;
  };
  [key: string]: any;
}

export interface ProductLineConfigEntity {
  id: string;
  code: string;
  name: string;
  description?: string;
  config: ProductLineConfiguration;
  status: ConfigStatus;
  version: string;
  productOwner?: string;
  technicalLead?: string;
  parentTemplateId?: string;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateProductLineConfigDto {
  code: string;
  name: string;
  description?: string;
  config: ProductLineConfiguration;
  status?: ConfigStatus;
  version?: string;
  productOwner?: string;
  technicalLead?: string;
  parentTemplateId?: string;
  isTemplate?: boolean;
  createdBy?: string;
}

export interface UpdateProductLineConfigDto {
  name?: string;
  description?: string;
  config?: ProductLineConfiguration;
  status?: ConfigStatus;
  version?: string;
  productOwner?: string;
  technicalLead?: string;
  updatedBy?: string;
}
