/**
 * Core mapping types and interfaces
 */

export type MappingDirection = 'to-cdm' | 'from-cdm';

export type TransformationType =
  | 'direct'           // Direct field copy
  | 'constant'         // Constant value
  | 'lookup'           // Lookup table
  | 'expression'       // JavaScript expression
  | 'function'         // Custom function
  | 'conditional'      // If-then-else logic
  | 'concat'           // Concatenate fields
  | 'split'            // Split field
  | 'format'           // Format value (date, currency, etc.)
  | 'default';         // Use default if source is null/undefined

export interface FieldMapping {
  sourceField: string;        // JSONPath to source field
  targetField: string;        // JSONPath to target field
  transformationType: TransformationType;

  // For 'constant' type
  constantValue?: any;

  // For 'lookup' type
  lookupTable?: string;       // Reference to lookup table
  lookupKey?: string;         // Key field for lookup
  lookupDefault?: any;        // Default if not found

  // For 'expression' type
  expression?: string;        // JS expression (e.g., "value * 2")

  // For 'function' type
  functionName?: string;      // Name of registered function
  functionArgs?: any[];       // Additional arguments

  // For 'conditional' type
  condition?: string;         // Condition expression
  trueValue?: any;           // Value if true
  falseValue?: any;          // Value if false

  // For 'concat' type
  concatFields?: string[];    // Fields to concatenate
  concatSeparator?: string;   // Separator (default: '')

  // For 'split' type
  splitSeparator?: string;    // Separator for split
  splitIndex?: number;        // Which part to take

  // For 'format' type
  format?: string;            // Format string
  formatType?: 'date' | 'currency' | 'number' | 'phone' | 'custom';

  // For 'default' type
  defaultValue?: any;

  // Common options
  required?: boolean;         // Is this field required?
  validators?: string[];      // Validation rules
  description?: string;       // Human-readable description
}

export interface MappingConfiguration {
  id: string;
  name: string;
  description?: string;
  version: string;
  sourceSystem: string;       // e.g., 'guidewire', 'earnix'
  targetSystem: string;       // Always 'cdm' for to-cdm, or system name for from-cdm
  direction: MappingDirection;
  productLine: string;        // e.g., 'general-liability', 'property'
  mappings: FieldMapping[];
  lookupTables?: Record<string, LookupTable>;
  customFunctions?: Record<string, string>; // Function name -> JS code
  metadata?: {
    createdBy?: string;
    createdAt?: string;
    updatedBy?: string;
    updatedAt?: string;
    tags?: string[];
  };
}

export interface LookupTable {
  name: string;
  description?: string;
  entries: Record<string, any>;
  defaultValue?: any;
}

export interface MappingResult {
  success: boolean;
  data?: any;
  errors?: MappingError[];
  warnings?: MappingWarning[];
  metadata?: {
    mappingId: string;
    direction: MappingDirection;
    executionTime?: number;
    fieldsProcessed?: number;
    fieldsMapped?: number;
  };
}

export interface MappingError {
  field: string;
  sourceField?: string;
  targetField?: string;
  message: string;
  code: string;
  value?: any;
}

export interface MappingWarning {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface MappingContext {
  sourceData: any;
  targetData?: any;
  lookupTables?: Record<string, LookupTable>;
  customFunctions?: Record<string, Function>;
  variables?: Record<string, any>;
}

export interface TransformationFunction {
  name: string;
  description?: string;
  function: (value: any, context: MappingContext, ...args: any[]) => any;
}
