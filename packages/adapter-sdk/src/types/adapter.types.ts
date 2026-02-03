/**
 * Core adapter types and interfaces
 */

import { Policy } from '@insurratex/cdm';

export interface AdapterConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  apiKey?: string;
  username?: string;
  password?: string;
  headers?: Record<string, string>;
  validateCertificates?: boolean;
}

export interface AdapterResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AdapterError;
  metadata?: AdapterMetadata;
}

export interface AdapterError {
  code: string;
  message: string;
  details?: any;
  retryable?: boolean;
}

export interface AdapterMetadata {
  requestId?: string;
  timestamp?: string;
  duration?: number;
  attempts?: number;
  systemVersion?: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  version?: string;
  latency?: number;
  details?: Record<string, any>;
}

export interface ConnectionOptions {
  timeout?: number;
  validateConnection?: boolean;
}
