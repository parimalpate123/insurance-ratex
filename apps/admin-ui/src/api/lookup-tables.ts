import { apiClient } from './client';

// ── Types ──────────────────────────────────────────────────────────────────

export type TableStatus = 'active' | 'draft' | 'archived';

export interface LookupEntry {
  id: string;
  lookupTableId: string;
  key: string;
  value: any;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LookupTable {
  id: string;
  name: string;
  description?: string;
  productLine: string;
  productLineCode?: string;
  status: TableStatus;
  version: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  entries?: LookupEntry[];
}

export interface CreateLookupTableDto {
  name: string;
  productLine: string;
  productLineCode?: string;
  description?: string;
  status?: TableStatus;
}

export interface UpdateLookupTableDto extends Partial<CreateLookupTableDto> {}

export interface CreateLookupEntryDto {
  key: string;
  value: any;
  description?: string;
}

// ── API Client ─────────────────────────────────────────────────────────────

export const lookupTablesApi = {
  getAll: async (productLineCode?: string): Promise<LookupTable[]> => {
    const params = productLineCode ? { productLineCode } : {};
    const { data } = await apiClient.get('/lookup-tables', { params });
    return data;
  },

  getById: async (id: string): Promise<LookupTable> => {
    const { data } = await apiClient.get(`/lookup-tables/${id}`);
    return data;
  },

  create: async (dto: CreateLookupTableDto): Promise<LookupTable> => {
    const { data } = await apiClient.post('/lookup-tables', dto);
    return data;
  },

  update: async (id: string, dto: UpdateLookupTableDto): Promise<LookupTable> => {
    const { data } = await apiClient.put(`/lookup-tables/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/lookup-tables/${id}`);
  },

  activate: async (id: string): Promise<LookupTable> => {
    const { data } = await apiClient.post(`/lookup-tables/${id}/activate`);
    return data;
  },

  // Entry management
  getEntries: async (tableId: string): Promise<LookupEntry[]> => {
    const { data } = await apiClient.get(`/lookup-tables/${tableId}/entries`);
    return data;
  },

  addEntry: async (tableId: string, dto: CreateLookupEntryDto): Promise<LookupEntry> => {
    const { data } = await apiClient.post(`/lookup-tables/${tableId}/entries`, dto);
    return data;
  },

  updateEntry: async (tableId: string, entryId: string, dto: Partial<CreateLookupEntryDto>): Promise<LookupEntry> => {
    const { data } = await apiClient.put(`/lookup-tables/${tableId}/entries/${entryId}`, dto);
    return data;
  },

  deleteEntry: async (tableId: string, entryId: string): Promise<void> => {
    await apiClient.delete(`/lookup-tables/${tableId}/entries/${entryId}`);
  },

  // Bulk import entries (from CSV/Excel)
  importEntries: async (
    tableId: string,
    entries: CreateLookupEntryDto[],
  ): Promise<{ imported: number }> => {
    const { data } = await apiClient.post(`/lookup-tables/${tableId}/entries/bulk`, { entries });
    return data;
  },

  // Lookup a value by key
  lookup: async (tableId: string, key: string): Promise<{ found: boolean; value?: any }> => {
    const { data } = await apiClient.get(`/lookup-tables/${tableId}/lookup/${encodeURIComponent(key)}`);
    return data;
  },
};
