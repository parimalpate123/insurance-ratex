import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Rule {
  id: string;
  name: string;
  type: 'lookup' | 'decision' | 'conditional';
  productLine: string;
  status: 'active' | 'draft' | 'archived';
  description?: string;
  version: string;
  createdAt?: string;
  updatedAt?: string;
  data: any;
}

export interface LookupTable {
  id: string;
  name: string;
  description?: string;
  productLine: string;
  entries: Array<{
    key: string;
    value: any;
    description?: string;
  }>;
}

export interface DecisionTable {
  id: string;
  name: string;
  description?: string;
  productLine: string;
  conditions: string[];
  actions: string[];
  rows: Array<{
    id: string;
    conditions: any[];
    actions: any[];
  }>;
}

export interface ConditionalRule {
  id: string;
  name: string;
  description?: string;
  productLine: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  actions: Array<{
    type: string;
    field: string;
    value: any;
  }>;
}

// Mock data for development
const mockRules: Rule[] = [
  {
    id: 'state-surcharges',
    name: 'State Territorial Surcharges',
    type: 'lookup',
    productLine: 'general-liability',
    status: 'active',
    version: '1.0.0',
    description: 'State-specific territorial surcharge percentages',
    data: {
      entries: [
        { key: 'CA', value: 5.0, description: 'California surcharge' },
        { key: 'NY', value: 8.0, description: 'New York surcharge' },
        { key: 'TX', value: 3.5, description: 'Texas surcharge' },
        { key: 'FL', value: 6.5, description: 'Florida surcharge' },
      ],
    },
  },
  {
    id: 'experience-modifier',
    name: 'Experience Modifier Based on Loss History',
    type: 'decision',
    productLine: 'general-liability',
    status: 'active',
    version: '1.0.0',
    description: 'Adjust premium based on claims history',
    data: {
      conditions: ['claimCount', 'totalIncurred'],
      actions: ['modifier'],
      rows: [
        { id: '1', conditions: [0, 0], actions: [-5.0] },
        { id: '2', conditions: [1, '<10000'], actions: [0] },
        { id: '3', conditions: [1, '>=10000'], actions: [5.0] },
        { id: '4', conditions: ['>=2', '*'], actions: [10.0] },
      ],
    },
  },
  {
    id: 'high-revenue-surcharge',
    name: 'High Revenue Surcharge',
    type: 'conditional',
    productLine: 'general-liability',
    status: 'active',
    version: '1.0.0',
    description: 'Apply surcharge for high revenue businesses',
    data: {
      conditions: [
        { field: 'insured.annualRevenue', operator: '>', value: 5000000 },
      ],
      actions: [
        { type: 'surcharge', field: 'premium', value: 4.0 },
      ],
    },
  },
];

export async function getRules(type?: string): Promise<Rule[]> {
  try {
    const params = type ? `?type=${type}` : '';
    const response = await api.get(`/rules${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rules:', error);
    // Fallback to mock data if API fails
    if (type) {
      return mockRules.filter((r) => r.type === type);
    }
    return mockRules;
  }
}

export async function getRule(id: string): Promise<Rule> {
  try {
    const response = await api.get(`/rules/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rule:', error);
    // Fallback to mock data
    const rule = mockRules.find((r) => r.id === id);
    if (!rule) throw new Error('Rule not found');
    return rule;
  }
}

export async function createRule(data: Partial<Rule>): Promise<Rule> {
  const response = await api.post('/rules', data);
  return response.data.rule || response.data;
}

export async function updateRule(id: string, data: Partial<Rule>): Promise<Rule> {
  const response = await api.put(`/rules/${id}`, data);
  return response.data;
}

export async function deleteRule(id: string): Promise<void> {
  await api.delete(`/rules/${id}`);
}

export async function testRule(id: string, testData: any): Promise<any> {
  const response = await api.post(`/rules/${id}/test`, testData);
  return response.data;
}

export async function getStats(): Promise<any> {
  return {
    totalRules: mockRules.length,
    activeRules: mockRules.filter((r) => r.status === 'active').length,
    lookupTables: mockRules.filter((r) => r.type === 'lookup').length,
    decisionTables: mockRules.filter((r) => r.type === 'decision').length,
    conditionalRules: mockRules.filter((r) => r.type === 'conditional').length,
  };
}

// AI-powered rule generation
export interface GeneratedRule {
  name: string;
  type: 'lookup' | 'decision' | 'conditional';
  description: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  actions: Array<{
    type: string;
    field: string;
    value: any;
  }>;
  confidence: number;
  reasoning: string;
}

export async function generateRuleFromDescription(
  description: string,
  productLine: string,
  ruleType?: 'lookup' | 'decision' | 'conditional'
): Promise<GeneratedRule> {
  const response = await api.post('/ai/generate-rule', {
    description,
    productLine,
    ruleType,
    context: {
      availableFields: ['annualRevenue', 'premium', 'state', 'employeeCount', 'yearsInBusiness'],
      operators: ['==', '!=', '>', '<', '>=', '<=', 'contains', 'in'],
      actions: ['surcharge', 'discount', 'set', 'multiply', 'reject'],
    },
  });
  return response.data.rule;
}
