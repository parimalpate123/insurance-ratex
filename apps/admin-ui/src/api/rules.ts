import { apiClient } from './client';

// ── Types ──────────────────────────────────────────────────────────────────

export type RuleStatus = 'active' | 'draft' | 'archived';

export type RuleOperator =
  | 'equals' | '=='
  | 'not_equals' | '!='
  | 'greater_than' | '>'
  | 'greater_than_or_equal' | '>='
  | 'less_than' | '<'
  | 'less_than_or_equal' | '<='
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'is_empty'
  | 'is_not_empty';

export type ActionType =
  | 'set'
  | 'set_value'
  | 'surcharge'
  | 'discount'
  | 'multiply'
  | 'divide'
  | 'add'
  | 'increment'
  | 'subtract'
  | 'decrement'
  | 'append'
  | 'remove'
  | 'reject';

export interface RuleCondition {
  id: string;
  ruleId: string;
  fieldPath: string;
  operator: RuleOperator;
  value: any;
  conditionOrder: number;
  createdAt: string;
}

export interface RuleAction {
  id: string;
  ruleId: string;
  actionType: ActionType;
  targetField: string;
  value: any;
  actionOrder: number;
  createdAt: string;
}

export interface ConditionalRule {
  id: string;
  name: string;
  description?: string;
  productLine: string;
  productLineCode?: string;
  status: RuleStatus;
  version: string;
  priority: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
}

export interface CreateRuleDto {
  name: string;
  productLine: string;
  productLineCode?: string;
  description?: string;
  status?: RuleStatus;
  priority?: number;
  conditions?: Array<{
    fieldPath: string;
    operator: RuleOperator;
    value: any;
    conditionOrder?: number;
  }>;
  actions?: Array<{
    actionType: ActionType;
    targetField: string;
    value: any;
    actionOrder?: number;
  }>;
}

export interface UpdateRuleDto extends Partial<Omit<CreateRuleDto, 'conditions' | 'actions'>> {
  conditions?: CreateRuleDto['conditions'];
  actions?: CreateRuleDto['actions'];
}

// ── API Client ─────────────────────────────────────────────────────────────

export const rulesApi = {
  getAll: async (productLineCode?: string): Promise<ConditionalRule[]> => {
    const params = productLineCode ? { productLineCode } : {};
    const { data } = await apiClient.get('/rules', { params });
    return data;
  },

  getById: async (id: string): Promise<ConditionalRule> => {
    const { data } = await apiClient.get(`/rules/${id}`);
    return data;
  },

  create: async (dto: CreateRuleDto): Promise<ConditionalRule> => {
    const { data } = await apiClient.post('/rules', dto);
    return data;
  },

  update: async (id: string, dto: UpdateRuleDto): Promise<ConditionalRule> => {
    const { data } = await apiClient.put(`/rules/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/rules/${id}`);
  },

  activate: async (id: string): Promise<ConditionalRule> => {
    const { data } = await apiClient.post(`/rules/${id}/activate`);
    return data;
  },

  // AI generation
  generateWithAI: async (dto: {
    productLineCode: string;
    requirements: string;
    context?: string;
  }): Promise<{ rule: ConditionalRule; confidence: number }> => {
    const { data } = await apiClient.post('/rules/generate-ai', dto);
    return data;
  },

  // Test a rule against sample data
  test: async (id: string, sampleData: any): Promise<{
    matched: boolean;
    actionsApplied: string[];
    resultData: any;
  }> => {
    const { data } = await apiClient.post(`/rules/${id}/test`, { data: sampleData });
    return data;
  },
};
