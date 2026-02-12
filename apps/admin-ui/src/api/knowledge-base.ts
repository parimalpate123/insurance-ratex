import { apiClient } from './client';

// ── Types ──────────────────────────────────────────────────────────────────

export type KBDocumentStatus = 'pending' | 'processing' | 'ready' | 'error';
export type KBDocumentType = 'pdf' | 'docx' | 'doc' | 'txt' | 'xlsx' | 'csv' | 'md';

export interface KBDocument {
  id: string;
  filename: string;
  originalFilename: string;
  fileType: KBDocumentType;
  fileSizeBytes: number;
  // S3 storage
  s3Key: string;
  s3Bucket: string;
  downloadUrl?: string;
  // Association
  productLineCode?: string;
  tags?: string[];
  // Processing status
  aiStatus: KBDocumentStatus;
  processingError?: string;
  chunkCount?: number;
  // Metadata
  uploadedBy?: string;
  uploadedAt: string;
  processedAt?: string;
  description?: string;
}

export interface KBUploadResult {
  document: KBDocument;
  uploadUrl?: string;
}

export interface KBSearchResult {
  documentId: string;
  filename: string;
  relevance: number;
  excerpt: string;
  pageNumber?: number;
  chunkIndex?: number;
}

export interface KBSearchResponse {
  results: KBSearchResult[];
  query: string;
  totalFound: number;
}

// ── API Client ─────────────────────────────────────────────────────────────

export const knowledgeBaseApi = {
  getAll: async (productLineCode?: string): Promise<KBDocument[]> => {
    const params = productLineCode ? { productLineCode } : {};
    const { data } = await apiClient.get('/knowledge-base', { params });
    return data;
  },

  getById: async (id: string): Promise<KBDocument> => {
    const { data } = await apiClient.get(`/knowledge-base/${id}`);
    return data;
  },

  upload: async (
    file: File,
    metadata: {
      productLineCode?: string;
      description?: string;
      tags?: string[];
    },
    onProgress?: (percent: number) => void,
  ): Promise<KBDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.productLineCode) {
      formData.append('productLineCode', metadata.productLineCode);
    }
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    if (metadata.tags?.length) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }

    const { data } = await apiClient.post('/knowledge-base/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return data;
  },

  update: async (
    id: string,
    dto: { description?: string; tags?: string[]; productLineCode?: string },
  ): Promise<KBDocument> => {
    const { data } = await apiClient.put(`/knowledge-base/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/knowledge-base/${id}`);
  },

  // Trigger re-processing (text extraction, future: vectorization)
  reprocess: async (id: string): Promise<KBDocument> => {
    const { data } = await apiClient.post(`/knowledge-base/${id}/reprocess`);
    return data;
  },

  // Get download URL for a document
  getDownloadUrl: async (id: string): Promise<{ url: string; expiresAt: string }> => {
    const { data } = await apiClient.get(`/knowledge-base/${id}/download-url`);
    return data;
  },

  // Keyword search (full-text, pre-vectorization)
  search: async (query: string, productLineCode?: string): Promise<KBSearchResponse> => {
    const params: any = { query };
    if (productLineCode) params.productLineCode = productLineCode;
    const { data } = await apiClient.get('/knowledge-base/search', { params });
    return data;
  },

  // Ask AI a question using KB documents as context
  askAI: async (
    question: string,
    productLineCode?: string,
  ): Promise<{ answer: string; sources: KBSearchResult[] }> => {
    const { data } = await apiClient.post('/knowledge-base/ask', {
      question,
      productLineCode,
    });
    return data;
  },
};
