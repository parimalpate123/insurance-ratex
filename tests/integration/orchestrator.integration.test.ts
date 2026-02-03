/**
 * Integration tests for Orchestrator service
 */

import axios from 'axios';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3000';

describe('Orchestrator Integration Tests', () => {
  beforeAll(async () => {
    // Wait for services to be ready
    await waitForService(`${ORCHESTRATOR_URL}/health`, 30000);
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${ORCHESTRATOR_URL}/health`);

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('ok');
      expect(response.data.service).toBe('orchestrator');
    });
  });

  describe('End-to-End Rating Flow', () => {
    it('should execute complete rating flow successfully', async () => {
      const request = {
        sourceSystem: 'guidewire',
        ratingEngine: 'earnix',
        productLine: 'general-liability',
        requestId: 'integration-test-001',
        applyRules: true,
        policyData: {
          quoteNumber: 'Q-INT-TEST-001',
          productCode: 'GL',
          effectiveDate: '2026-03-01',
          expirationDate: '2027-03-01',
          insured: {
            name: 'Integration Test Company',
            businessType: 'MFG',
            addressLine1: '123 Test St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            annualRevenue: 5000000,
          },
          classification: {
            code: '91580',
          },
          coverages: [
            {
              id: 'cov-001',
              limit: 2000000,
              deductible: 5000,
              primary: true,
            },
          ],
        },
      };

      const response = await axios.post(
        `${ORCHESTRATOR_URL}/api/v1/rating/execute`,
        request
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.requestId).toBe('integration-test-001');
      expect(response.data.totalPremium).toBeGreaterThan(0);

      // Validate metadata
      expect(response.data.metadata).toBeDefined();
      expect(response.data.metadata.sourceSystem).toBe('guidewire');
      expect(response.data.metadata.ratingEngine).toBe('earnix');
      expect(response.data.metadata.steps).toHaveLength(4);

      // Validate all steps succeeded
      response.data.metadata.steps.forEach((step: any) => {
        expect(step.success).toBe(true);
      });

      // Validate premium breakdown
      expect(response.data.premiumBreakdown).toBeDefined();
      expect(response.data.premiumBreakdown.basePremium).toBeGreaterThan(0);
    });

    it('should handle different states correctly', async () => {
      const states = ['CA', 'TX', 'NY'];

      for (const state of states) {
        const request = {
          sourceSystem: 'guidewire',
          ratingEngine: 'earnix',
          productLine: 'general-liability',
          policyData: {
            quoteNumber: `Q-STATE-${state}-001`,
            productCode: 'GL',
            insured: {
              name: 'Test Company',
              businessType: 'MFG',
              addressLine1: '123 Test St',
              city: 'Test City',
              state,
              postalCode: '12345',
              annualRevenue: 5000000,
            },
            classification: { code: '91580' },
            coverages: [{ id: 'cov-001', limit: 1000000, deductible: 5000 }],
          },
        };

        const response = await axios.post(
          `${ORCHESTRATOR_URL}/api/v1/rating/execute`,
          request
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        console.log(`State ${state}: Premium = $${response.data.totalPremium}`);
      }
    });

    it('should apply business rules when enabled', async () => {
      const requestWithRules = {
        sourceSystem: 'guidewire',
        ratingEngine: 'earnix',
        productLine: 'general-liability',
        applyRules: true,
        policyData: {
          quoteNumber: 'Q-RULES-TEST-001',
          productCode: 'GL',
          insured: {
            name: 'Test Company',
            businessType: 'MFG',
            state: 'CA',
            annualRevenue: 5000000,
          },
          classification: { code: '91580' },
          coverages: [{ id: 'cov-001', limit: 2000000, deductible: 5000 }],
        },
      };

      const response = await axios.post(
        `${ORCHESTRATOR_URL}/api/v1/rating/execute`,
        requestWithRules
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.premiumBreakdown.rulesApplied).toBeDefined();
      expect(response.data.premiumBreakdown.rulesApplied.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid source system', async () => {
      const request = {
        sourceSystem: 'invalid-system',
        ratingEngine: 'earnix',
        productLine: 'general-liability',
        policyData: {},
      };

      try {
        await axios.post(`${ORCHESTRATOR_URL}/api/v1/rating/execute`, request);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should handle missing required fields', async () => {
      const request = {
        sourceSystem: 'guidewire',
        ratingEngine: 'earnix',
        productLine: 'general-liability',
        policyData: {
          // Missing required fields
        },
      };

      const response = await axios.post(
        `${ORCHESTRATOR_URL}/api/v1/rating/execute`,
        request
      );

      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });
  });
});

// Helper function to wait for service
async function waitForService(url: string, timeout: number): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await axios.get(url);
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Service not ready: ${url}`);
}
