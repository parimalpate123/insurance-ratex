/**
 * Logger interface and implementations
 */

import * as winston from 'winston';

export interface AdapterLogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: any): void;
}

/**
 * Console logger implementation (default)
 */
export class ConsoleLogger implements AdapterLogger {
  debug(message: string, meta?: any): void {
    console.debug(`[DEBUG] ${message}`, meta || '');
  }

  info(message: string, meta?: any): void {
    console.info(`[INFO] ${message}`, meta || '');
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${message}`, meta || '');
  }

  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error || '');
  }
}

/**
 * Winston logger implementation (production)
 */
export class WinstonLogger implements AdapterLogger {
  private logger: winston.Logger;

  constructor(options?: winston.LoggerOptions) {
    this.logger = winston.createLogger({
      level: options?.level || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: options?.transports || [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
      ...options,
    });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: any): void {
    this.logger.error(message, { error });
  }

  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

/**
 * Silent logger for testing
 */
export class SilentLogger implements AdapterLogger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}
