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
  // Mock data for now - will be replaced with real API
  return [
    {
      id: 'guidewire-to-cdm-gl',
      name: 'Guidewire to CDM (General Liability)',
      sourceSystem: 'guidewire',
      targetSystem: 'cdm',
      productLine: 'general-liability',
      version: '1.2.0',
      status: 'active',
      fieldCount: 45,
      fields: [],
    },
    {
      id: 'cdm-to-earnix-gl',
      name: 'CDM to Earnix (General Liability)',
      sourceSystem: 'cdm',
      targetSystem: 'earnix',
      productLine: 'general-liability',
      version: '1.0.0',
      status: 'active',
      fieldCount: 38,
      fields: [],
    },
    {
      id: 'guidewire-to-cdm-property',
      name: 'Guidewire to CDM (Property)',
      sourceSystem: 'guidewire',
      targetSystem: 'cdm',
      productLine: 'property',
      version: '1.0.0',
      status: 'draft',
      fieldCount: 52,
      fields: [],
    },
  ];
}

export async function getMapping(id: string): Promise<Mapping> {
  // Mock data
  return {
    id,
    name: 'Guidewire to CDM (General Liability)',
    sourceSystem: 'guidewire',
    targetSystem: 'cdm',
    productLine: 'general-liability',
    version: '1.2.0',
    status: 'active',
    fieldCount: 45,
    fields: [
      {
        id: 'field-1',
        source: '$.Quote.QuoteNumber',
        target: 'policyId',
        type: 'direct',
        required: true,
        description: 'Quote number to policy ID',
      },
      {
        id: 'field-2',
        source: '$.Quote.AccountHolder.AccountHolderName',
        target: 'insured.name',
        type: 'direct',
        required: true,
        description: 'Account holder name',
      },
      {
        id: 'field-3',
        source: '$.Quote.AccountHolder.PrimaryAddress.State',
        target: 'insured.state',
        type: 'lookup',
        required: true,
        transformation: {
          lookupTable: 'state-codes',
        },
        description: 'State code lookup',
      },
      {
        id: 'field-4',
        source: '$.Quote.Effective',
        target: 'effectiveDate',
        type: 'expression',
        required: true,
        transformation: {
          expression: 'new Date(value).toISOString().split("T")[0]',
        },
        description: 'Format effective date',
      },
    ],
  };
}

export async function createMapping(data: Partial<Mapping>): Promise<Mapping> {
  const response = await api.post('/mappings', data);
  return response.data;
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
