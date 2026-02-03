import { MappingExecutor } from '../executor/mapping-executor';
import { MappingConfiguration } from '../types/mapping.types';

describe('MappingExecutor', () => {
  let executor: MappingExecutor;

  beforeEach(() => {
    executor = new MappingExecutor();
  });

  describe('direct transformation', () => {
    it('should map fields directly', () => {
      const config: MappingConfiguration = {
        id: 'test-1',
        name: 'Test Direct Mapping',
        version: '1.0.0',
        sourceSystem: 'test',
        targetSystem: 'cdm',
        direction: 'to-cdm',
        productLine: 'general-liability',
        mappings: [
          {
            sourceField: 'name',
            targetField: 'insured.name',
            transformationType: 'direct',
            required: true,
          },
          {
            sourceField: 'revenue',
            targetField: 'insured.annualRevenue',
            transformationType: 'direct',
          },
        ],
      };

      const sourceData = {
        name: 'Acme Corp',
        revenue: 5000000,
      };

      const result = executor.execute(config, sourceData);

      expect(result.success).toBe(true);
      expect(result.data.insured.name).toBe('Acme Corp');
      expect(result.data.insured.annualRevenue).toBe(5000000);
    });
  });

  describe('constant transformation', () => {
    it('should set constant values', () => {
      const config: MappingConfiguration = {
        id: 'test-2',
        name: 'Test Constant',
        version: '1.0.0',
        sourceSystem: 'test',
        targetSystem: 'cdm',
        direction: 'to-cdm',
        productLine: 'general-liability',
        mappings: [
          {
            sourceField: '',
            targetField: 'version',
            transformationType: 'constant',
            constantValue: 'gl-v1.2',
          },
          {
            sourceField: '',
            targetField: 'status',
            transformationType: 'constant',
            constantValue: 'quote',
          },
        ],
      };

      const result = executor.execute(config, {});

      expect(result.success).toBe(true);
      expect(result.data.version).toBe('gl-v1.2');
      expect(result.data.status).toBe('quote');
    });
  });

  describe('lookup transformation', () => {
    it('should lookup values from table', () => {
      const config: MappingConfiguration = {
        id: 'test-3',
        name: 'Test Lookup',
        version: '1.0.0',
        sourceSystem: 'test',
        targetSystem: 'cdm',
        direction: 'to-cdm',
        productLine: 'general-liability',
        mappings: [
          {
            sourceField: 'productCode',
            targetField: 'productLine',
            transformationType: 'lookup',
            lookupTable: 'productMapping',
          },
        ],
        lookupTables: {
          productMapping: {
            name: 'Product Mapping',
            entries: {
              GL: 'general-liability',
              PROP: 'property',
            },
          },
        },
      };

      const result = executor.execute(config, { productCode: 'GL' });

      expect(result.success).toBe(true);
      expect(result.data.productLine).toBe('general-liability');
    });

    it('should use default value when lookup fails', () => {
      const config: MappingConfiguration = {
        id: 'test-4',
        name: 'Test Lookup Default',
        version: '1.0.0',
        sourceSystem: 'test',
        targetSystem: 'cdm',
        direction: 'to-cdm',
        productLine: 'general-liability',
        mappings: [
          {
            sourceField: 'productCode',
            targetField: 'productLine',
            transformationType: 'lookup',
            lookupTable: 'productMapping',
            lookupDefault: 'unknown',
          },
        ],
        lookupTables: {
          productMapping: {
            name: 'Product Mapping',
            entries: {
              GL: 'general-liability',
            },
          },
        },
      };

      const result = executor.execute(config, { productCode: 'INVALID' });

      expect(result.success).toBe(true);
      expect(result.data.productLine).toBe('unknown');
    });
  });

  describe('expression transformation', () => {
    it('should evaluate JavaScript expressions', () => {
      const config: MappingConfiguration = {
        id: 'test-5',
        name: 'Test Expression',
        version: '1.0.0',
        sourceSystem: 'test',
        targetSystem: 'cdm',
        direction: 'to-cdm',
        productLine: 'general-liability',
        mappings: [
          {
            sourceField: 'exposure',
            targetField: 'calculatedValue',
            transformationType: 'expression',
            expression: 'value * 2.5',
          },
        ],
      };

      const result = executor.execute(config, { exposure: 1000 });

      expect(result.success).toBe(true);
      expect(result.data.calculatedValue).toBe(2500);
    });
  });

  describe('conditional transformation', () => {
    it('should apply conditional logic', () => {
      const config: MappingConfiguration = {
        id: 'test-6',
        name: 'Test Conditional',
        version: '1.0.0',
        sourceSystem: 'test',
        targetSystem: 'cdm',
        direction: 'to-cdm',
        productLine: 'general-liability',
        mappings: [
          {
            sourceField: 'state',
            targetField: 'territory',
            transformationType: 'conditional',
            condition: 'value === "CA"',
            trueValue: 'high-risk',
            falseValue: 'standard',
          },
        ],
      };

      const result1 = executor.execute(config, { state: 'CA' });
      expect(result1.data.territory).toBe('high-risk');

      const result2 = executor.execute(config, { state: 'TX' });
      expect(result2.data.territory).toBe('standard');
    });
  });

  describe('concat transformation', () => {
    it('should concatenate multiple fields', () => {
      const config: MappingConfiguration = {
        id: 'test-7',
        name: 'Test Concat',
        version: '1.0.0',
        sourceSystem: 'test',
        targetSystem: 'cdm',
        direction: 'to-cdm',
        productLine: 'general-liability',
        mappings: [
          {
            sourceField: '',
            targetField: 'fullAddress',
            transformationType: 'concat',
            concatFields: ['street', 'city', 'state'],
            concatSeparator: ', ',
          },
        ],
      };

      const sourceData = {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
      };

      const result = executor.execute(config, sourceData);

      expect(result.success).toBe(true);
      expect(result.data.fullAddress).toBe('123 Main St, San Francisco, CA');
    });
  });

  describe('default transformation', () => {
    it('should use default when source is undefined', () => {
      const config: MappingConfiguration = {
        id: 'test-8',
        name: 'Test Default',
        version: '1.0.0',
        sourceSystem: 'test',
        targetSystem: 'cdm',
        direction: 'to-cdm',
        productLine: 'general-liability',
        mappings: [
          {
            sourceField: 'missingField',
            targetField: 'value',
            transformationType: 'default',
            defaultValue: 'N/A',
          },
        ],
      };

      const result = executor.execute(config, {});

      expect(result.success).toBe(true);
      expect(result.data.value).toBe('N/A');
    });
  });

  describe('validation', () => {
    it('should validate required fields', () => {
      const config: MappingConfiguration = {
        id: 'test-9',
        name: 'Test Required',
        version: '1.0.0',
        sourceSystem: 'test',
        targetSystem: 'cdm',
        direction: 'to-cdm',
        productLine: 'general-liability',
        mappings: [
          {
            sourceField: 'name',
            targetField: 'insured.name',
            transformationType: 'direct',
            required: true,
          },
        ],
      };

      const result = executor.execute(config, {});

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].code).toBe('REQUIRED_FIELD_MISSING');
    });

    it('should validate field constraints', () => {
      const config: MappingConfiguration = {
        id: 'test-10',
        name: 'Test Validators',
        version: '1.0.0',
        sourceSystem: 'test',
        targetSystem: 'cdm',
        direction: 'to-cdm',
        productLine: 'general-liability',
        mappings: [
          {
            sourceField: 'revenue',
            targetField: 'insured.annualRevenue',
            transformationType: 'direct',
            validators: ['min:0'],
          },
        ],
      };

      const result = executor.execute(config, { revenue: -1000 });

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0].code).toBe('MIN_VALUE');
    });
  });

  describe('metadata', () => {
    it('should include execution metadata', () => {
      const config: MappingConfiguration = {
        id: 'test-11',
        name: 'Test Metadata',
        version: '1.0.0',
        sourceSystem: 'test',
        targetSystem: 'cdm',
        direction: 'to-cdm',
        productLine: 'general-liability',
        mappings: [
          {
            sourceField: 'name',
            targetField: 'insured.name',
            transformationType: 'direct',
          },
        ],
      };

      const result = executor.execute(config, { name: 'Acme' });

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.mappingId).toBe('test-11');
      expect(result.metadata!.direction).toBe('to-cdm');
      expect(result.metadata!.fieldsProcessed).toBe(1);
      expect(result.metadata!.fieldsMapped).toBe(1);
      expect(result.metadata!.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
});
