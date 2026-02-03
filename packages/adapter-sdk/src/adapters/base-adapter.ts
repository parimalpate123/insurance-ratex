/**
 * Base Adapter - Abstract class for all adapters
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as rax from 'retry-axios';
import {
  AdapterConfig,
  AdapterResponse,
  AdapterError,
  HealthCheckResult,
  ConnectionOptions,
} from '../types/adapter.types';
import { AdapterLogger, ConsoleLogger } from '../utils/logger';

export abstract class BaseAdapter {
  protected config: AdapterConfig;
  protected httpClient: AxiosInstance;
  protected logger: AdapterLogger;
  protected connected: boolean = false;

  constructor(config: AdapterConfig, logger?: AdapterLogger) {
    this.config = config;
    this.logger = logger || new ConsoleLogger();
    this.httpClient = this.createHttpClient();
  }

  /**
   * Create configured HTTP client with retry logic
   */
  protected createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
    });

    // Add retry logic
    const retryConfig = {
      retry: this.config.retries || 3,
      retryDelay: this.config.retryDelay || 1000,
      statusCodesToRetry: [[500, 599], [429, 429]],
      httpMethodsToRetry: ['GET', 'POST', 'PUT', 'DELETE'],
      onRetryAttempt: (err: any) => {
        const cfg = rax.getConfig(err);
        this.logger.warn(
          `Retry attempt #${cfg?.currentRetryAttempt} for ${err.config?.url}`
        );
      },
    };

    rax.attach(client);
    client.defaults.raxConfig = retryConfig;

    // Add request interceptor for auth
    client.interceptors.request.use((config) => {
      if (this.config.apiKey) {
        config.headers['X-API-Key'] = this.config.apiKey;
      } else if (this.config.username && this.config.password) {
        const auth = Buffer.from(
          `${this.config.username}:${this.config.password}`
        ).toString('base64');
        config.headers['Authorization'] = `Basic ${auth}`;
      }
      return config;
    });

    // Add response interceptor for logging
    client.interceptors.response.use(
      (response) => {
        this.logger.debug(`Response from ${response.config.url}: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error(`Request failed: ${error.message}`, error);
        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * Connect to the external system
   */
  async connect(options?: ConnectionOptions): Promise<void> {
    try {
      this.logger.info(`Connecting to ${this.config.baseUrl}...`);

      if (options?.validateConnection) {
        const health = await this.healthCheck();
        if (!health.healthy) {
          throw new Error('Health check failed during connection');
        }
      }

      this.connected = true;
      this.logger.info('Connection established');
    } catch (error) {
      this.logger.error('Connection failed', error);
      throw error;
    }
  }

  /**
   * Disconnect from the external system
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.logger.info('Disconnected');
  }

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Health check - must be implemented by concrete adapters
   */
  abstract healthCheck(): Promise<HealthCheckResult>;

  /**
   * Get adapter name/type - must be implemented by concrete adapters
   */
  abstract getAdapterName(): string;

  /**
   * Helper method to create standardized responses
   */
  protected createResponse<T>(
    data?: T,
    error?: AdapterError,
    metadata?: any
  ): AdapterResponse<T> {
    return {
      success: !error,
      data,
      error,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Helper method to create error responses
   */
  protected createErrorResponse(
    code: string,
    message: string,
    details?: any,
    retryable: boolean = false
  ): AdapterResponse {
    return this.createResponse(undefined, {
      code,
      message,
      details,
      retryable,
    });
  }

  /**
   * Helper method to handle HTTP errors
   */
  protected handleHttpError(error: any): AdapterError {
    if (error.response) {
      // Server responded with error status
      return {
        code: `HTTP_${error.response.status}`,
        message: error.response.data?.message || error.message,
        details: error.response.data,
        retryable: error.response.status >= 500,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        code: 'NO_RESPONSE',
        message: 'No response received from server',
        details: error.message,
        retryable: true,
      };
    } else {
      // Error in request setup
      return {
        code: 'REQUEST_ERROR',
        message: error.message,
        details: error,
        retryable: false,
      };
    }
  }
}
