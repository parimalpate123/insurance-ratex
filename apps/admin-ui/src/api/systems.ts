import { apiClient } from './client';

export interface SystemConfig {
  id: string;
  name: string;
  code: string;
  description?: string;
  type: 'source' | 'target' | 'both';
  protocol: 'rest' | 'soap' | 'mock';
  format: 'json' | 'xml' | 'soap';
  baseUrl?: string;
  authConfig?: Record<string, any>;
  headers?: Record<string, any>;
  isMock: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const systemsApi = {
  list: (includeInactive = false) =>
    apiClient.get<SystemConfig[]>(`/systems?includeInactive=${includeInactive}`).then(r => r.data),

  get: (id: string) =>
    apiClient.get<SystemConfig>(`/systems/${id}`).then(r => r.data),

  create: (dto: Partial<SystemConfig>) =>
    apiClient.post<SystemConfig>('/systems', dto).then(r => r.data),

  update: (id: string, dto: Partial<SystemConfig>) =>
    apiClient.put<SystemConfig>(`/systems/${id}`, dto).then(r => r.data),

  remove: (id: string) =>
    apiClient.delete(`/systems/${id}`).then(r => r.data),
};
