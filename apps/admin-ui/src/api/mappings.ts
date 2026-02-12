import { apiClient } from './client';

// ── Types ──────────────────────────────────────────────────────────────────

export type MappingStatus = 'active' | 'draft' | 'archived';
export type CreationMethod = 'manual' | 'excel' | 'text' | 'ai' | 'jira' | 'ai_detect' | 'hybrid';
export type TransformationType =
  | 'direct'
  | 'lookup'
  | 'expression'
  | 'conditional'
  | 'static'
  | 'concat'
  | 'split'
  | 'aggregate'
  | 'custom'
  | 'nested'
  | 'uppercase'
  | 'lowercase'
  | 'trim'
  | 'number'
  | 'string'
  | 'boolean'
  | 'date';

export interface FieldMapping {
  id: string;
  mappingId: string;
  sourcePath: string;
  targetPath: string;
  transformationType: TransformationType;
  isRequired: boolean;
  defaultValue?: string;
  transformationConfig?: any;
  validationRules?: any;
  description?: string;
  productLineCode?: string;
  dataType?: string;
  fieldDirection: string;
  fieldIdentifier?: string;
  skipMapping: boolean;
  skipBehavior: string;
  catalogFieldId?: string;
  sampleInput?: string;
  sampleOutput?: string;
  // AI fields
  aiSuggested?: boolean;
  aiConfidence?: number;
  aiReasoning?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Mapping {
  id: string;
  name: string;
  sourceSystem: string;
  targetSystem: string;
  productLine: string;
  productLineCode?: string;
  version: string;
  status: MappingStatus;
  description?: string;
  creationMethod?: CreationMethod;
  sourceReference?: string;
  aiConfidenceScore?: number;
  mappingNumber?: string;
  sourceContent?: string;
  sessionId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  fieldMappings?: FieldMapping[];
}

export interface CreateMappingDto {
  name: string;
  sourceSystem: string;
  targetSystem: string;
  productLine: string;
  productLineCode?: string;
  description?: string;
  status?: MappingStatus;
  creationMethod?: CreationMethod;
}

export interface UpdateMappingDto extends Partial<CreateMappingDto> {
  fieldMappings?: Partial<FieldMapping>[];
}

export interface CreateFieldMappingDto {
  sourcePath: string;
  targetPath: string;
  transformationType?: TransformationType;
  isRequired?: boolean;
  defaultValue?: string;
  transformationConfig?: any;
  description?: string;
  dataType?: string;
}

// ── API Client ─────────────────────────────────────────────────────────────

export const mappingsApi = {
  getAll: async (productLineCode?: string): Promise<Mapping[]> => {
    const params = productLineCode ? { productLineCode } : {};
    const { data } = await apiClient.get('/mappings', { params });
    return data;
  },

  getById: async (id: string): Promise<Mapping> => {
    const { data } = await apiClient.get(`/mappings/${id}`);
    return data;
  },

  create: async (dto: CreateMappingDto): Promise<Mapping> => {
    const { data } = await apiClient.post('/mappings', dto);
    return data;
  },

  update: async (id: string, dto: UpdateMappingDto): Promise<Mapping> => {
    const { data } = await apiClient.put(`/mappings/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/mappings/${id}`);
  },

  activate: async (id: string): Promise<Mapping> => {
    const { data } = await apiClient.post(`/mappings/${id}/activate`);
    return data;
  },

  // Field mappings
  getFieldMappings: async (mappingId: string): Promise<FieldMapping[]> => {
    const { data } = await apiClient.get(`/mappings/${mappingId}/fields`);
    return data;
  },

  addFieldMapping: async (mappingId: string, dto: CreateFieldMappingDto): Promise<FieldMapping> => {
    const { data } = await apiClient.post(`/mappings/${mappingId}/fields`, dto);
    return data;
  },

  updateFieldMapping: async (
    mappingId: string,
    fieldId: string,
    dto: Partial<CreateFieldMappingDto>,
  ): Promise<FieldMapping> => {
    const { data } = await apiClient.put(`/mappings/${mappingId}/fields/${fieldId}`, dto);
    return data;
  },

  deleteFieldMapping: async (mappingId: string, fieldId: string): Promise<void> => {
    await apiClient.delete(`/mappings/${mappingId}/fields/${fieldId}`);
  },

  // AI generation
  generateWithAI: async (dto: {
    productLineCode: string;
    sourceSystem: string;
    targetSystem: string;
    requirements?: string;
    sourceSchema?: any;
  }): Promise<{ mapping: Mapping; confidence: number }> => {
    const { data } = await apiClient.post('/mappings/generate-ai', dto);
    return data;
  },
};
