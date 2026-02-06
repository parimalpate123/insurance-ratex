import { apiClient } from './client';

export interface ProductLineConfig {
  id: string;
  code: string;
  name: string;
  description?: string;
  config: any;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  version: string;
  productOwner?: string;
  technicalLead?: string;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RatingExecutionRequest {
  data: any;
  context?: any;
}

export interface RatingExecutionResponse {
  success: boolean;
  productLineCode: string;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    executionTimeMs: number;
    steps: Array<{
      id: string;
      name: string;
      success: boolean;
      duration: number;
      error?: string;
    }>;
    rulesApplied?: string[];
    timestamp: string;
  };
}

export const productLinesApi = {
  // Get all product lines
  getAll: async (includeTemplates = false): Promise<ProductLineConfig[]> => {
    const { data } = await apiClient.get('/product-lines', {
      params: { includeTemplates },
    });
    return data;
  },

  // Get templates only
  getTemplates: async (): Promise<ProductLineConfig[]> => {
    const { data } = await apiClient.get('/product-lines/templates');
    return data;
  },

  // Get by code
  getByCode: async (code: string): Promise<ProductLineConfig> => {
    const { data } = await apiClient.get(`/product-lines/${code}`);
    return data;
  },

  // Create new product line
  create: async (productLine: Partial<ProductLineConfig>): Promise<ProductLineConfig> => {
    const { data } = await apiClient.post('/product-lines', productLine);
    return data;
  },

  // Update product line
  update: async (
    code: string,
    updates: Partial<ProductLineConfig>
  ): Promise<ProductLineConfig> => {
    const { data } = await apiClient.put(`/product-lines/${code}`, updates);
    return data;
  },

  // Delete product line
  delete: async (code: string): Promise<void> => {
    await apiClient.delete(`/product-lines/${code}`);
  },

  // Execute rating
  executeRating: async (
    productLineCode: string,
    request: RatingExecutionRequest
  ): Promise<RatingExecutionResponse> => {
    const { data } = await apiClient.post(
      `/rating/${productLineCode}/execute`,
      request
    );
    return data;
  },

  // Clear cache
  clearCache: async (): Promise<void> => {
    await apiClient.post('/product-lines/cache/clear');
  },
};
