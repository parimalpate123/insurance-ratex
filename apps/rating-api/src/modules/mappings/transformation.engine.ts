import { Injectable, Logger } from '@nestjs/common';

// ── Types ─────────────────────────────────────────────────────────────────

export interface FieldResult {
  fieldMappingId: string;
  sourcePath: string;
  targetPath: string;
  transformationType: string;
  sourceValue: any;
  transformedValue: any;
  status: 'success' | 'skipped' | 'error' | 'default';
  error?: string;
  note?: string;
}

export interface TransformationResult {
  output: Record<string, any>;
  fieldResults: FieldResult[];
  successCount: number;
  skippedCount: number;
  errorCount: number;
  durationMs: number;
}

// ── Engine ────────────────────────────────────────────────────────────────

@Injectable()
export class TransformationEngine {
  private readonly logger = new Logger(TransformationEngine.name);

  /**
   * Execute all field mappings against source data.
   * Returns the transformed output object plus a per-field audit trail.
   *
   * @param fieldMappings   Array of FieldMapping-like objects from DB
   * @param sourceData      The inbound JSON (context.working)
   * @param lookupFn        Optional: resolve lookup table values (injected by controller)
   */
  execute(
    fieldMappings: any[],
    sourceData: Record<string, any>,
    lookupFn?: (tableKey: string, key: string) => Promise<string | null>,
  ): Promise<TransformationResult> {
    return this._execute(fieldMappings, sourceData, lookupFn);
  }

  private async _execute(
    fieldMappings: any[],
    sourceData: Record<string, any>,
    lookupFn?: (tableKey: string, key: string) => Promise<string | null>,
  ): Promise<TransformationResult> {
    const start = Date.now();
    const output: Record<string, any> = {};
    const fieldResults: FieldResult[] = [];

    for (const fm of fieldMappings) {
      const result = await this.executeField(fm, sourceData, output, lookupFn);
      fieldResults.push(result);

      if (result.status === 'success' || result.status === 'default') {
        this.setByPath(output, fm.targetPath, result.transformedValue);
      }
    }

    return {
      output,
      fieldResults,
      successCount: fieldResults.filter((r) => r.status === 'success').length,
      skippedCount: fieldResults.filter((r) => r.status === 'skipped').length,
      errorCount: fieldResults.filter((r) => r.status === 'error').length,
      durationMs: Date.now() - start,
    };
  }

  // ── Single field execution ─────────────────────────────────────────────

  async executeField(
    fm: any,
    sourceData: Record<string, any>,
    currentOutput: Record<string, any>,
    lookupFn?: (tableKey: string, key: string) => Promise<string | null>,
  ): Promise<FieldResult> {
    const base: Omit<FieldResult, 'transformedValue' | 'status'> = {
      fieldMappingId: fm.id,
      sourcePath: fm.sourcePath,
      targetPath: fm.targetPath,
      transformationType: fm.transformationType ?? 'direct',
      sourceValue: undefined,
      error: undefined,
      note: undefined,
    };

    // Skip flag takes priority
    if (fm.skipMapping) {
      const behavior = fm.skipBehavior ?? 'exclude';
      if (behavior === 'use_default' && fm.defaultValue != null) {
        return { ...base, sourceValue: null, transformedValue: fm.defaultValue, status: 'default', note: 'Skipped — using default value' };
      }
      return { ...base, sourceValue: null, transformedValue: undefined, status: 'skipped', note: 'Field marked as skip' };
    }

    // Read source value
    const sourceValue = this.getByPath(sourceData, fm.sourcePath);

    // Missing required field
    if (sourceValue === undefined || sourceValue === null) {
      if (fm.isRequired && fm.defaultValue == null) {
        return { ...base, sourceValue, transformedValue: undefined, status: 'error', error: `Required field "${fm.sourcePath}" is missing` };
      }
      if (fm.defaultValue != null) {
        return { ...base, sourceValue, transformedValue: this.coerce(fm.defaultValue, fm.dataType), status: 'default', note: 'Source missing — using default value' };
      }
      return { ...base, sourceValue, transformedValue: undefined, status: 'skipped', note: 'Source value not present' };
    }

    const cfg = fm.transformationConfig ?? {};

    try {
      const transformed = await this.applyTransformation(
        sourceValue,
        fm.transformationType ?? 'direct',
        cfg,
        sourceData,
        currentOutput,
        lookupFn,
      );
      return { ...base, sourceValue, transformedValue: transformed, status: 'success' };
    } catch (err: any) {
      this.logger.warn(`Transform error on field "${fm.sourcePath}": ${err.message}`);
      if (fm.defaultValue != null) {
        return { ...base, sourceValue, transformedValue: fm.defaultValue, status: 'default', error: err.message, note: 'Transform failed — using default value' };
      }
      return { ...base, sourceValue, transformedValue: undefined, status: 'error', error: err.message };
    }
  }

  // ── Transformation type dispatch ──────────────────────────────────────

  private async applyTransformation(
    value: any,
    type: string,
    config: Record<string, any>,
    sourceData: Record<string, any>,
    currentOutput: Record<string, any>,
    lookupFn?: (tableKey: string, key: string) => Promise<string | null>,
  ): Promise<any> {
    switch (type) {

      // ── Direct ──────────────────────────────────────────────────────
      case 'direct':
        return value;

      // ── String ops ──────────────────────────────────────────────────
      case 'uppercase':
        return String(value).toUpperCase();

      case 'lowercase':
        return String(value).toLowerCase();

      case 'trim':
        return String(value).trim();

      case 'split': {
        // config: { delimiter, index }
        const delim = config.delimiter ?? ',';
        const idx = Number(config.index ?? 0);
        const parts = String(value).split(delim);
        return parts[idx]?.trim() ?? value;
      }

      // ── Numeric ──────────────────────────────────────────────────────
      case 'number':
        return this.toNumber(value);

      // ── Type casting ─────────────────────────────────────────────────
      case 'boolean':
        return Boolean(value);

      case 'string':
        return String(value);

      // ── Static value ─────────────────────────────────────────────────
      case 'static':
        // config: { value }
        if (config.value === undefined) throw new Error('static transform requires config.value');
        return this.coerce(config.value, config.dataType);

      // ── Date formatting ───────────────────────────────────────────────
      case 'date': {
        // config: { outputFormat? }   supported: YYYY-MM-DD, MM/DD/YYYY, timestamp, epoch
        const d = new Date(value);
        if (isNaN(d.getTime())) throw new Error(`Cannot parse "${value}" as a date`);
        const fmt = config.outputFormat ?? 'YYYY-MM-DD';
        return this.formatDate(d, fmt);
      }

      // ── Concat multiple source fields ──────────────────────────────────
      case 'concat': {
        // config: { fields: ['path1','path2'], separator: ' ' }
        const fields: string[] = config.fields ?? [];
        if (!fields.length) throw new Error('concat requires config.fields array');
        const separator = config.separator ?? ' ';
        const parts = fields.map((f) => {
          const v = this.getByPath(sourceData, f);
          return v != null ? String(v) : '';
        });
        return parts.join(separator);
      }

      // ── Arithmetic expression ─────────────────────────────────────────
      case 'expression':
      case 'custom': {
        // config: { expression: "value / 1000" }
        // Available variables: value, and any flat sourceData field
        const expr = config.expression;
        if (!expr) throw new Error('expression transform requires config.expression');
        return this.evaluateExpression(expr, value, sourceData);
      }

      // ── Conditional ───────────────────────────────────────────────────
      case 'conditional': {
        // config: { condition: "value > 5000000", trueValue: "large", falseValue: "small" }
        const condition = config.condition;
        if (!condition) throw new Error('conditional transform requires config.condition');
        const result = this.evaluateCondition(condition, value, sourceData);
        const out = result ? config.trueValue : config.falseValue;
        return out ?? value;
      }

      // ── Lookup table reference ────────────────────────────────────────
      case 'lookup': {
        // config: { tableKey: "gl-territory-factors" }
        // The lookup key is the current field value
        const tableKey = config.tableKey;
        if (!tableKey) throw new Error('lookup transform requires config.tableKey');
        if (!lookupFn) throw new Error(`lookup transform for "${tableKey}" requires a lookup function — check service wiring`);
        const looked = await lookupFn(tableKey, String(value));
        if (looked === null && fm_defaultValue_placeholder(config)) {
          return config.notFoundValue ?? value;
        }
        return looked ?? value;
      }

      // ── Multiply / divide shorthand (common in rating) ────────────────
      case 'multiply': {
        // config: { factor: 1.15 }
        const factor = config.factor;
        if (factor == null) throw new Error('multiply transform requires config.factor');
        return this.toNumber(value) * this.toNumber(factor);
      }

      case 'divide': {
        const divisor = config.divisor;
        if (divisor == null) throw new Error('divide transform requires config.divisor');
        if (this.toNumber(divisor) === 0) throw new Error('Division by zero');
        return this.toNumber(value) / this.toNumber(divisor);
      }

      case 'round': {
        // config: { decimals: 2 }
        const decimals = config.decimals ?? 2;
        return Math.round(this.toNumber(value) * Math.pow(10, decimals)) / Math.pow(10, decimals);
      }

      case 'per_unit': {
        // Common in WC/GL: value / unitSize  e.g. payroll / 100
        const unit = config.unitSize ?? 100;
        return this.toNumber(value) / this.toNumber(unit);
      }

      default:
        this.logger.warn(`Unknown transformationType "${type}" — falling back to direct`);
        return value;
    }
  }

  // ── Safe expression evaluator ────────────────────────────────────────────
  // Supports: arithmetic (+,-,*,/,%), Math functions, string functions
  // Variables: value + any top-level field from sourceData
  // No eval() — uses a whitelist parser

  private evaluateExpression(expr: string, value: any, sourceData: Record<string, any>): any {
    // Build variable context
    const vars: Record<string, any> = { value, ...this.flattenForExpr(sourceData) };

    // Substitute variable names with their values
    let resolved = expr;
    for (const [k, v] of Object.entries(vars)) {
      const numVal = typeof v === 'number' ? v : typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : null;
      if (numVal !== null) {
        resolved = resolved.replace(new RegExp(`\\b${k}\\b`, 'g'), String(numVal));
      }
    }

    // Validate expression is safe (only allow numbers, operators, spaces, parens, math fns)
    const safe = /^[\d\s\+\-\*\/\%\.\(\)]+$/.test(resolved.replace(/Math\.\w+/g, '0'));
    if (!safe) throw new Error(`Unsafe expression: "${expr}" — only arithmetic operators allowed`);

    // Evaluate via Function constructor (scoped, no global access)
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(`"use strict"; return (${resolved});`)();
      return result;
    } catch (e: any) {
      throw new Error(`Expression evaluation failed: ${e.message}`);
    }
  }

  private evaluateCondition(condition: string, value: any, sourceData: Record<string, any>): boolean {
    const vars: Record<string, any> = { value, ...this.flattenForExpr(sourceData) };

    let resolved = condition;
    for (const [k, v] of Object.entries(vars)) {
      const numVal = typeof v === 'number' ? v : typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : null;
      if (numVal !== null) {
        resolved = resolved.replace(new RegExp(`\\b${k}\\b`, 'g'), String(numVal));
      }
    }

    // Allow comparison operators and string literals
    const safe = /^[\d\s\+\-\*\/\%\.\(\)\<\>\=\!\&\|"']+$/.test(resolved);
    if (!safe) throw new Error(`Unsafe condition: "${condition}"`);

    try {
      // eslint-disable-next-line no-new-func
      return Boolean(new Function(`"use strict"; return (${resolved});`)());
    } catch (e: any) {
      throw new Error(`Condition evaluation failed: ${e.message}`);
    }
  }

  // ── Utilities ────────────────────────────────────────────────────────────

  /**
   * Read a value from a nested object using dot-notation or JSONPath ($.a.b.c).
   * Supports array index: fieldName[0].subField
   */
  getByPath(obj: any, path: string): any {
    if (!path || obj == null) return undefined;

    // Strip JSONPath $ prefix
    const clean = path.startsWith('$.') ? path.slice(2) : path.startsWith('$') ? path.slice(1) : path;
    if (!clean) return obj;

    const parts = clean.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
    let current = obj;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  }

  /**
   * Set a value on a nested object using dot-notation path, creating intermediates.
   */
  setByPath(obj: Record<string, any>, path: string, value: any): void {
    if (!path) return;
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
    let current: any = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] == null || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }

  private toNumber(v: any): number {
    const n = Number(v);
    if (isNaN(n)) throw new Error(`Cannot convert "${v}" to a number`);
    return n;
  }

  private coerce(value: any, dataType?: string): any {
    if (!dataType) return value;
    switch (dataType) {
      case 'number': case 'decimal': case 'integer': return Number(value);
      case 'boolean': return Boolean(value);
      case 'string': return String(value);
      default: return value;
    }
  }

  private formatDate(d: Date, fmt: string): string {
    switch (fmt) {
      case 'timestamp': return d.toISOString();
      case 'epoch': return String(d.getTime());
      case 'MM/DD/YYYY': return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
      case 'DD/MM/YYYY': return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      case 'YYYY-MM-DD':
      default:
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }

  /** Flatten nested source data to single-level for expression variable substitution */
  private flattenForExpr(obj: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj ?? {})) {
      const key = prefix ? `${prefix}_${k}` : k;
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(result, this.flattenForExpr(v, key));
      } else if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') {
        result[key] = v;
      }
    }
    return result;
  }
}

// Silence TS warning — placeholder for lookup config.notFoundValue access
function fm_defaultValue_placeholder(config: any): boolean { return config != null; }
