import { BaseAdapter } from '../adapters/base-adapter';
import { HealthCheckResult, AdapterConfig } from '../types/adapter.types';
import { SilentLogger } from '../utils/logger';

class TestAdapter extends BaseAdapter {
  getAdapterName(): string {
    return 'TestAdapter';
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      healthy: true,
      version: '1.0.0',
    };
  }
}

describe('BaseAdapter', () => {
  let config: AdapterConfig;
  let adapter: TestAdapter;

  beforeEach(() => {
    config = {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3,
    };
    adapter = new TestAdapter(config, new SilentLogger());
  });

  describe('constructor', () => {
    it('should create adapter with config', () => {
      expect(adapter).toBeInstanceOf(BaseAdapter);
      expect(adapter.getAdapterName()).toBe('TestAdapter');
    });

    it('should initialize as disconnected', () => {
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);
    });

    it('should validate connection when requested', async () => {
      await adapter.connect({ validateConnection: true });
      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);

      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const health = await adapter.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.version).toBe('1.0.0');
    });
  });

  describe('createResponse', () => {
    it('should create success response', () => {
      const response = adapter['createResponse']({ test: 'data' });
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ test: 'data' });
      expect(response.metadata?.timestamp).toBeDefined();
    });

    it('should create error response', () => {
      const response = adapter['createErrorResponse']('TEST_ERROR', 'Test error message');
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('TEST_ERROR');
      expect(response.error?.message).toBe('Test error message');
    });
  });
});
