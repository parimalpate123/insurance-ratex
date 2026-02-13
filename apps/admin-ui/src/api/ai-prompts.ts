import { apiClient } from './client';

export interface AiPrompt {
  id: string;
  key: string;
  name: string;
  description: string | null;
  template: string;
  variables: string[];
  kbQueryTemplate: string | null;
  kbTopK: number;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAiPromptDto {
  name?: string;
  description?: string;
  template?: string;
  kbQueryTemplate?: string;
  kbTopK?: number;
  isActive?: boolean;
}

export const aiPromptsApi = {
  list: (): Promise<AiPrompt[]> =>
    apiClient.get('/ai-prompts').then((r) => r.data),

  get: (key: string): Promise<AiPrompt> =>
    apiClient.get(`/ai-prompts/${key}`).then((r) => r.data),

  update: (key: string, dto: UpdateAiPromptDto): Promise<AiPrompt> =>
    apiClient.put(`/ai-prompts/${key}`, dto).then((r) => r.data),

  reset: (key: string): Promise<{ message: string }> =>
    apiClient.delete(`/ai-prompts/${key}/reset`).then((r) => r.data),
};
