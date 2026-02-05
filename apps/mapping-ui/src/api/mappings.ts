import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Mapping {
  id: string;
  name: string;
  sourceSystem: string;
  targetSystem: string;
  productLine: string;
  version: string;
  status: 'active' | 'draft' | 'archived';
  fieldCount: number;
  fields: FieldMapping[];
  mappingNumber?: string;
  sourceContent?: string;
  sourceReference?: string;
  creationMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FieldMapping {
  id: string;
  source: string;
  target: string;
  type: 'direct' | 'lookup' | 'expression' | 'conditional' | 'static' | 'concat' | 'split' | 'aggregate' | 'custom' | 'nested';
  required: boolean;
  defaultValue?: any;
  transformation?: any;
  validation?: any;
  description?: string;
}

export async function getMappings(): Promise<Mapping[]> {
  const response = await fetch('http://localhost:3000/api/v1/mappings');
  if (!response.ok) {
    throw new Error('Failed to fetch mappings');
  }
  const result = await response.json();

  // Transform backend response to frontend format
  return (result.data || []).map((mapping: any) => ({
    id: mapping.id,
    name: mapping.name || '(Unnamed)',
    sourceSystem: mapping.sourceSystem || '',
    targetSystem: mapping.targetSystem || '',
    productLine: mapping.productLine || '',
    version: mapping.version || '1.0.0',
    status: mapping.status || 'draft',
    fieldCount: 0, // We don't have field count in list view
    fields: [], // Fields not included in list view
    mappingNumber: mapping.mappingNumber,
    creationMethod: mapping.creationMethod,
    createdAt: mapping.createdAt,
    updatedAt: mapping.updatedAt,
  }));
}

export async function getMapping(id: string): Promise<Mapping> {
  const response = await fetch(`http://localhost:3000/api/v1/mappings/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch mapping');
  }
  const result = await response.json();

  // Transform backend response to frontend format
  const mapping = result.data;
  return {
    id: mapping.id,
    name: mapping.name,
    sourceSystem: mapping.sourceSystem,
    targetSystem: mapping.targetSystem,
    productLine: mapping.productLine,
    version: mapping.version,
    status: mapping.status,
    fieldCount: mapping.fieldMappings?.length || 0,
    fields: (mapping.fieldMappings || []).map((fm: any) => ({
      id: fm.id,
      source: fm.sourcePath,
      target: fm.targetPath,
      type: fm.transformationType,
      required: fm.isRequired,
      defaultValue: fm.defaultValue,
      transformation: fm.transformationConfig,
      validation: fm.validationRules,
      description: fm.description,
    })),
    mappingNumber: mapping.mappingNumber,
    sourceContent: mapping.sourceContent,
    sourceReference: mapping.sourceReference,
    creationMethod: mapping.creationMethod,
    createdAt: mapping.createdAt,
    updatedAt: mapping.updatedAt,
  };
}

export async function createMapping(data: Partial<Mapping>): Promise<Mapping> {
  const response = await api.post('/mappings', data);
  return response.data;
}

// New API for creating mapping with field mappings
export async function createMappingWithFields(data: {
  name: string;
  sourceSystem: string;
  targetSystem: string;
  productLine: string;
  version?: string;
  description?: string;
  creationMethod?: 'manual' | 'excel' | 'ai' | 'text' | 'jira';
  sourceReference?: string;
  sourceContent?: string;
  sessionId?: string;
  fieldMappings?: Array<{
    sourcePath: string;
    targetPath: string;
    transformationType?: string;
    isRequired?: boolean;
    defaultValue?: string;
    transformationConfig?: any;
    validationRules?: any;
    description?: string;
    confidence?: number;
    reasoning?: string;
  }>;
}): Promise<{ success: boolean; message: string; data: Mapping }> {
  const response = await fetch('http://localhost:3000/api/v1/mappings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create mapping');
  }

  return response.json();
}

export async function updateMapping(id: string, data: Partial<Mapping>): Promise<Mapping> {
  const response = await api.put(`/mappings/${id}`, data);
  return response.data;
}

export async function deleteMapping(id: string): Promise<void> {
  await api.delete(`/mappings/${id}`);
}

export async function testMapping(id: string, sampleData: any): Promise<any> {
  const response = await api.post(`/mappings/${id}/test`, { data: sampleData });
  return response.data;
}

// AI-powered mapping suggestions
export interface FieldInfo {
  path: string;
  name: string;
  type: string;
  description?: string;
  sampleValue?: any;
}

export interface MappingSuggestion {
  sourceField: string;
  targetField: string;
  confidence: number;
  reasoning: string;
  suggestedTransformation?: string;
}

export async function getSuggestedMappings(
  sourceFields: FieldInfo[],
  targetFields: FieldInfo[],
  sourceSystem: string,
  targetSystem: string,
  productLine: string
): Promise<MappingSuggestion[]> {
  const response = await api.post('/ai/suggest-mappings', {
    sourceFields,
    targetFields,
    sourceSystem,
    targetSystem,
    productLine,
  });
  return response.data.suggestions || [];
}
