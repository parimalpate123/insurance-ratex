const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface FieldSuggestion {
  sourcePath: string;
  targetPath: string;
  transformationType?: string;
  transformationConfig?: any;
  confidence: number;
  reasoning?: string;
}

export interface ParseExcelResponse {
  success: boolean;
  filename: string;
  suggestions: FieldSuggestion[];
  totalSuggestions: number;
  highConfidenceCount: number;
  averageConfidence: number;
}

export interface GenerateSuggestionsRequest {
  sourceSchemaId: string;
  targetSchemaId: string;
  productLine?: string;
  context?: string;
}

export interface GenerateSuggestionsResponse {
  suggestions: FieldSuggestion[];
  totalSuggestions: number;
  highConfidenceCount: number;
  averageConfidence: number;
  processingTimeMs: number;
}

/**
 * Parse Excel/CSV file containing mapping requirements
 */
export async function parseExcelFile(file: File): Promise<ParseExcelResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/v1/ai/mappings/parse-excel`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to parse Excel file');
  }

  return response.json();
}

/**
 * Validate Excel file structure
 */
export async function validateExcelFile(file: File): Promise<{
  filename: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/v1/ai/mappings/validate-excel`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to validate Excel file');
  }

  return response.json();
}

/**
 * Generate AI-powered mapping suggestions
 */
export async function generateAISuggestions(
  request: GenerateSuggestionsRequest,
): Promise<GenerateSuggestionsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/ai/mappings/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate suggestions');
  }

  return response.json();
}

/**
 * Get AI suggestion history
 */
export async function getSuggestionHistory(
  mappingId?: string,
  limit: number = 50,
): Promise<any[]> {
  const params = new URLSearchParams();
  if (mappingId) params.append('mappingId', mappingId);
  params.append('limit', limit.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/v1/ai/mappings/history?${params}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch suggestion history');
  }

  return response.json();
}

/**
 * Parse text requirements (JIRA story, plain text)
 */
export async function parseTextRequirements(
  text: string,
  context?: {
    sourceSystem?: string;
    targetSystem?: string;
    productLine?: string;
  },
): Promise<ParseExcelResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/ai/mappings/parse-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, context }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to parse text requirements');
  }

  return response.json();
}

/**
 * Calculate similarity between two field paths
 */
export async function calculateFieldSimilarity(
  path1: string,
  path2: string,
): Promise<{
  path1: string;
  path2: string;
  similarity: number;
  match: 'high' | 'medium' | 'low' | 'none';
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/ai/mappings/similarity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path1, path2 }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate similarity');
  }

  return response.json();
}
