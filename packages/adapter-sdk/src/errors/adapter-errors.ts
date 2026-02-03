/**
 * Custom error classes for adapters
 */

export class AdapterError extends Error {
  public code: string;
  public retryable: boolean;
  public details?: any;

  constructor(code: string, message: string, retryable: boolean = false, details?: any) {
    super(message);
    this.name = 'AdapterError';
    this.code = code;
    this.retryable = retryable;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConnectionError extends AdapterError {
  constructor(message: string, details?: any) {
    super('CONNECTION_ERROR', message, true, details);
    this.name = 'ConnectionError';
  }
}

export class AuthenticationError extends AdapterError {
  constructor(message: string, details?: any) {
    super('AUTHENTICATION_ERROR', message, false, details);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AdapterError {
  public validationErrors: Array<{ field: string; message: string }>;

  constructor(message: string, validationErrors: Array<{ field: string; message: string }>) {
    super('VALIDATION_ERROR', message, false, validationErrors);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

export class TimeoutError extends AdapterError {
  constructor(message: string, timeout: number) {
    super('TIMEOUT_ERROR', message, true, { timeout });
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends AdapterError {
  public retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super('RATE_LIMIT_ERROR', message, true, { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class NotFoundError extends AdapterError {
  constructor(resource: string, identifier: string) {
    super('NOT_FOUND', `${resource} not found: ${identifier}`, false);
    this.name = 'NotFoundError';
  }
}

export class TransformationError extends AdapterError {
  constructor(message: string, details?: any) {
    super('TRANSFORMATION_ERROR', message, false, details);
    this.name = 'TransformationError';
  }
}

export class SystemUnavailableError extends AdapterError {
  constructor(systemName: string, details?: any) {
    super('SYSTEM_UNAVAILABLE', `${systemName} is currently unavailable`, true, details);
    this.name = 'SystemUnavailableError';
  }
}
