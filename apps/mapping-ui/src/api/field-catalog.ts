export interface FieldCatalogEntry {
  id: string;
  fieldName: string;
  displayName: string;
  dataType: string;
  category?: string;
  description?: string;
  sampleValue?: string;
  isRequired: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getFieldCatalog(filters?: {
  category?: string;
  dataType?: string;
  search?: string;
}): Promise<FieldCatalogEntry[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.dataType) params.append('dataType', filters.dataType);
  if (filters?.search) params.append('search', filters.search);

  const url = `http://localhost:3000/api/v1/field-catalog${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch field catalog');
  }

  const result = await response.json();
  return result.data || [];
}

export async function getFieldCatalogCategories(): Promise<string[]> {
  const response = await fetch('http://localhost:3000/api/v1/field-catalog/categories');

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const result = await response.json();
  return result.data || [];
}

export async function createFieldCatalogEntry(data: {
  fieldName: string;
  displayName: string;
  dataType: string;
  category?: string;
  description?: string;
  sampleValue?: string;
  isRequired?: boolean;
}): Promise<FieldCatalogEntry> {
  const response = await fetch('http://localhost:3000/api/v1/field-catalog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create field catalog entry');
  }

  const result = await response.json();
  return result.data;
}
