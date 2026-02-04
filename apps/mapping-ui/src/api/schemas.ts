const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SchemaField {
  path: string;
  type: string;
  description?: string;
  required?: boolean;
  sample?: any;
}

export interface SchemaData {
  fields: SchemaField[];
  metadata?: Record<string, any>;
}

export interface Schema {
  id: string;
  systemName: string;
  version: string;
  schemaType: 'library' | 'custom' | 'detected';
  schemaData: SchemaData;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchemaListItem {
  id: string;
  systemName: string;
  version: string;
  schemaType: string;
  description?: string;
  fieldCount: number;
}

/**
 * List all available schemas
 */
export async function listSchemas(systemName?: string): Promise<SchemaListItem[]> {
  const params = new URLSearchParams();
  if (systemName) params.append('systemName', systemName);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/schemas/library?${params}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch schemas');
  }

  return response.json();
}

/**
 * Get schema by ID
 */
export async function getSchemaById(id: string): Promise<Schema> {
  const response = await fetch(`${API_BASE_URL}/api/v1/schemas/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch schema');
  }

  return response.json();
}

/**
 * Get latest version of a schema
 */
export async function getLatestSchema(systemName: string): Promise<Schema> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/schemas/system/${systemName}/latest`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch schema');
  }

  return response.json();
}

/**
 * Get specific version of a schema
 */
export async function getSchema(
  systemName: string,
  version: string,
): Promise<Schema> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/schemas/system/${systemName}/version/${version}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch schema');
  }

  return response.json();
}

/**
 * Upload custom schema
 */
export async function uploadSchema(
  file: File,
  systemName: string,
  version: string,
  description?: string,
): Promise<Schema> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('systemName', systemName);
  formData.append('version', version);
  if (description) formData.append('description', description);

  const response = await fetch(`${API_BASE_URL}/api/v1/schemas/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload schema');
  }

  return response.json();
}

/**
 * Compare two schemas
 */
export async function compareSchemas(
  schema1Id: string,
  schema2Id: string,
): Promise<{
  commonFields: string[];
  onlyInSchema1: string[];
  onlyInSchema2: string[];
  typeMismatches: Array<{ path: string; type1: string; type2: string }>;
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/schemas/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ schema1Id, schema2Id }),
  });

  if (!response.ok) {
    throw new Error('Failed to compare schemas');
  }

  return response.json();
}

/**
 * Search for fields across schemas
 */
export async function searchFields(
  searchTerm: string,
  systemName?: string,
): Promise<
  Array<{
    schemaId: string;
    systemName: string;
    version: string;
    field: SchemaField;
  }>
> {
  const params = new URLSearchParams();
  params.append('q', searchTerm);
  if (systemName) params.append('systemName', systemName);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/schemas/search/fields?${params}`,
  );

  if (!response.ok) {
    throw new Error('Failed to search fields');
  }

  return response.json();
}

/**
 * Delete a schema
 */
export async function deleteSchema(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/schemas/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete schema');
  }
}
