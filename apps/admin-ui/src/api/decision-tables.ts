import { apiClient } from './client';

// ── Types ──────────────────────────────────────────────────────────────────

export type TableStatus = 'active' | 'draft' | 'archived';

export interface DecisionTableColumn {
  name: string;
  field: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  operator?: string;
  description?: string;
}

export interface DecisionTableRow {
  id: string;
  decisionTableId: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  rowOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionTable {
  id: string;
  name: string;
  description?: string;
  productLine: string;
  productLineCode?: string;
  status: TableStatus;
  version: string;
  conditionColumns: DecisionTableColumn[];
  actionColumns: DecisionTableColumn[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  rows?: DecisionTableRow[];
}

export interface CreateDecisionTableDto {
  name: string;
  productLine: string;
  productLineCode?: string;
  description?: string;
  status?: TableStatus;
  conditionColumns: DecisionTableColumn[];
  actionColumns: DecisionTableColumn[];
}

export interface UpdateDecisionTableDto extends Partial<CreateDecisionTableDto> {}

export interface UpsertRowDto {
  conditions: Record<string, any>;
  actions: Record<string, any>;
  rowOrder?: number;
}

// ── API Client ─────────────────────────────────────────────────────────────

export const decisionTablesApi = {
  getAll: async (productLineCode?: string): Promise<DecisionTable[]> => {
    const params = productLineCode ? { productLineCode } : {};
    const { data } = await apiClient.get('/decision-tables', { params });
    return data;
  },

  getById: async (id: string): Promise<DecisionTable> => {
    const { data } = await apiClient.get(`/decision-tables/${id}`);
    return data;
  },

  create: async (dto: CreateDecisionTableDto): Promise<DecisionTable> => {
    const { data } = await apiClient.post('/decision-tables', dto);
    return data;
  },

  update: async (id: string, dto: UpdateDecisionTableDto): Promise<DecisionTable> => {
    const { data } = await apiClient.put(`/decision-tables/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/decision-tables/${id}`);
  },

  activate: async (id: string): Promise<DecisionTable> => {
    const { data } = await apiClient.post(`/decision-tables/${id}/activate`);
    return data;
  },

  // Row management
  getRows: async (tableId: string): Promise<DecisionTableRow[]> => {
    const { data } = await apiClient.get(`/decision-tables/${tableId}/rows`);
    return data;
  },

  addRow: async (tableId: string, dto: UpsertRowDto): Promise<DecisionTableRow> => {
    const { data } = await apiClient.post(`/decision-tables/${tableId}/rows`, dto);
    return data;
  },

  updateRow: async (tableId: string, rowId: string, dto: Partial<UpsertRowDto>): Promise<DecisionTableRow> => {
    const { data } = await apiClient.put(`/decision-tables/${tableId}/rows/${rowId}`, dto);
    return data;
  },

  deleteRow: async (tableId: string, rowId: string): Promise<void> => {
    await apiClient.delete(`/decision-tables/${tableId}/rows/${rowId}`);
  },

  // Bulk row import (from CSV/Excel)
  importRows: async (tableId: string, rows: UpsertRowDto[]): Promise<{ imported: number }> => {
    const { data } = await apiClient.post(`/decision-tables/${tableId}/rows/bulk`, { rows });
    return data;
  },

  // Evaluate table against data
  evaluate: async (tableId: string, inputData: any): Promise<{
    matched: boolean;
    matchedRow?: DecisionTableRow;
    actions: Record<string, any>;
  }> => {
    const { data } = await apiClient.post(`/decision-tables/${tableId}/evaluate`, { data: inputData });
    return data;
  },
};
