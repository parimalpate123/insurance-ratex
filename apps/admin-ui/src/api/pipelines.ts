import { apiClient } from './client';

export interface PipelineStep {
  id?: string;
  stepOrder: number;
  stepType: 'transform' | 'execute_rules' | 'call_system' | 'mock_response';
  name?: string;
  config: Record<string, any>;
  isActive?: boolean;
}

export interface RoutingRule {
  id?: string;
  productLine?: string;
  sourceSystem?: string;
  transactionType?: string;
  priority?: number;
  isActive?: boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  productLineCode?: string;
  sourceSystemCode?: string;
  targetSystemCode?: string;
  status: 'active' | 'draft' | 'archived';
  version: string;
  steps: PipelineStep[];
  routingRules: RoutingRule[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineExecutionResult {
  pipelineId: string;
  pipelineName: string;
  success: boolean;
  input: any;
  output: any;
  steps: Array<{
    stepOrder: number;
    stepType: string;
    name: string;
    success: boolean;
    durationMs: number;
    detail?: any;
    error?: string;
  }>;
  durationMs: number;
  error?: string;
}

export const pipelinesApi = {
  list: () =>
    apiClient.get<Pipeline[]>('/pipelines').then(r => r.data),

  get: (id: string) =>
    apiClient.get<Pipeline>(`/pipelines/${id}`).then(r => r.data),

  create: (dto: Partial<Pipeline>) =>
    apiClient.post<Pipeline>('/pipelines', dto).then(r => r.data),

  update: (id: string, dto: Partial<Pipeline>) =>
    apiClient.put<Pipeline>(`/pipelines/${id}`, dto).then(r => r.data),

  remove: (id: string) =>
    apiClient.delete(`/pipelines/${id}`).then(r => r.data),

  execute: (id: string, data: any) =>
    apiClient.post<PipelineExecutionResult>(`/pipelines/${id}/execute`, { data }).then(r => r.data),

  routeAndExecute: (params: { productLine: string; sourceSystem: string; transactionType?: string; data: any }) =>
    apiClient.post<PipelineExecutionResult>('/pipelines/route/execute', params).then(r => r.data),
};
