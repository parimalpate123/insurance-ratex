export interface DataType {
  id: string;
  typeName: string;
  displayName: string;
  validationPattern?: string;
  exampleValue?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getDataTypes(): Promise<DataType[]> {
  const response = await fetch('http://localhost:3000/api/v1/data-types');

  if (!response.ok) {
    throw new Error('Failed to fetch data types');
  }

  const result = await response.json();
  return result.data || [];
}

export async function createDataType(data: {
  typeName: string;
  displayName: string;
  validationPattern?: string;
  exampleValue?: string;
}): Promise<DataType> {
  const response = await fetch('http://localhost:3000/api/v1/data-types', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create data type');
  }

  const result = await response.json();
  return result.data;
}
