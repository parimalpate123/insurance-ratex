import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { FieldSuggestion } from '../entities/ai-suggestion.entity';

export interface ExcelMappingRow {
  sourceFieldPath: string;
  targetField: string;
  transformationType?: string;
  businessRule?: string;
  sampleValue?: string;
  description?: string;
}

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name);

  /**
   * Parse Excel/CSV file containing mapping requirements
   * Expected columns: Source Field Path, Target Field, Transformation Type, Business Rule, Sample Value
   */
  async parseExcelFile(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<FieldSuggestion[]> {
    this.logger.log(`Parsing Excel file: ${filename}`);

    try {
      // Read workbook
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new BadRequestException('Excel file has no sheets');
      }

      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json<any>(worksheet, {
        defval: '',
      });

      if (rawData.length === 0) {
        throw new BadRequestException('Excel file is empty');
      }

      this.logger.log(`Found ${rawData.length} rows in Excel file`);

      // Validate and transform to suggestions
      const suggestions: FieldSuggestion[] = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNum = i + 2; // +2 for 1-based and header row

        try {
          const suggestion = this.parseRow(row, rowNum);
          if (suggestion) {
            suggestions.push(suggestion);
          }
        } catch (error) {
          this.logger.warn(
            `Skipping row ${rowNum}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Successfully parsed ${suggestions.length} valid mappings`,
      );

      return suggestions;
    } catch (error) {
      this.logger.error(`Error parsing Excel file: ${error.message}`);
      throw new BadRequestException(
        `Failed to parse Excel file: ${error.message}`,
      );
    }
  }

  /**
   * Parse CSV file
   */
  async parseCsvFile(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<FieldSuggestion[]> {
    this.logger.log(`Parsing CSV file: ${filename}`);

    try {
      // Convert CSV to workbook
      const csvText = fileBuffer.toString('utf-8');
      const workbook = XLSX.read(csvText, { type: 'string' });

      // Reuse Excel parsing logic
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json<any>(worksheet, {
        defval: '',
      });

      const suggestions: FieldSuggestion[] = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        try {
          const suggestion = this.parseRow(row, i + 2);
          if (suggestion) {
            suggestions.push(suggestion);
          }
        } catch (error) {
          this.logger.warn(`Skipping row ${i + 2}: ${error.message}`);
        }
      }

      return suggestions;
    } catch (error) {
      this.logger.error(`Error parsing CSV file: ${error.message}`);
      throw new BadRequestException(
        `Failed to parse CSV file: ${error.message}`,
      );
    }
  }

  /**
   * Parse individual row from Excel/CSV
   */
  private parseRow(row: any, rowNum: number): FieldSuggestion | null {
    // Handle multiple possible column name formats
    const sourcePath =
      row['Source Field Path'] ||
      row['sourceFieldPath'] ||
      row['source_path'] ||
      row['SourcePath'] ||
      '';

    const targetPath =
      row['Target Field'] ||
      row['targetField'] ||
      row['target_path'] ||
      row['TargetPath'] ||
      '';

    // Skip empty rows
    if (!sourcePath && !targetPath) {
      return null;
    }

    // Validate required fields
    if (!sourcePath) {
      throw new Error(`Missing source field path at row ${rowNum}`);
    }
    if (!targetPath) {
      throw new Error(`Missing target field at row ${rowNum}`);
    }

    const transformationType =
      row['Transformation Type'] ||
      row['transformationType'] ||
      row['transformation_type'] ||
      row['Type'] ||
      'direct';

    const businessRule =
      row['Business Rule'] ||
      row['businessRule'] ||
      row['business_rule'] ||
      row['Rule'] ||
      '';

    const sampleValue =
      row['Sample Value'] ||
      row['sampleValue'] ||
      row['sample_value'] ||
      row['Sample'] ||
      '';

    const description =
      row['Description'] || row['description'] || row['Notes'] || '';

    // Build transformation config based on type
    const transformationConfig = this.buildTransformationConfig(
      transformationType,
      businessRule,
      sampleValue,
    );

    // Assign confidence based on completeness
    const confidence = this.calculateConfidence(
      sourcePath,
      targetPath,
      transformationType,
      businessRule,
    );

    const suggestion: FieldSuggestion = {
      sourcePath: sourcePath.trim(),
      targetPath: targetPath.trim(),
      transformationType: transformationType.trim().toLowerCase(),
      transformationConfig,
      confidence,
      reasoning: this.generateReasoning(
        sourcePath,
        targetPath,
        transformationType,
        description,
      ),
    };

    return suggestion;
  }

  /**
   * Build transformation config based on type
   */
  private buildTransformationConfig(
    type: string,
    businessRule: string,
    sampleValue: string,
  ): any {
    const config: any = {};

    switch (type.toLowerCase()) {
      case 'lookup':
        if (businessRule) {
          config.lookupTable = businessRule;
        }
        break;

      case 'expression':
      case 'calculate':
        if (businessRule) {
          config.expression = businessRule;
        }
        break;

      case 'conditional':
        if (businessRule) {
          config.condition = businessRule;
        }
        break;

      case 'static':
        if (sampleValue) {
          config.staticValue = sampleValue;
        }
        break;

      case 'concat':
        if (businessRule) {
          config.separator = businessRule;
        }
        break;

      default:
        // Direct mapping, no config needed
        break;
    }

    return Object.keys(config).length > 0 ? config : undefined;
  }

  /**
   * Calculate confidence score based on completeness
   */
  private calculateConfidence(
    sourcePath: string,
    targetPath: string,
    transformationType: string,
    businessRule: string,
  ): number {
    let confidence = 70; // Base confidence

    // Increase confidence for clear paths
    if (sourcePath.includes('.') && targetPath.includes('.')) {
      confidence += 10;
    }

    // Increase confidence for direct mappings
    if (transformationType === 'direct') {
      confidence += 15;
    }

    // Increase confidence if business rule is provided for complex types
    if (
      businessRule &&
      ['lookup', 'expression', 'conditional'].includes(
        transformationType.toLowerCase(),
      )
    ) {
      confidence += 10;
    }

    return Math.min(confidence, 99); // Cap at 99
  }

  /**
   * Generate human-readable reasoning for the suggestion
   */
  private generateReasoning(
    sourcePath: string,
    targetPath: string,
    transformationType: string,
    description: string,
  ): string {
    let reasoning = `Map ${sourcePath} to ${targetPath}`;

    if (transformationType !== 'direct') {
      reasoning += ` using ${transformationType} transformation`;
    }

    if (description) {
      reasoning += `. ${description}`;
    }

    return reasoning;
  }

  /**
   * Validate Excel file structure
   */
  validateExcelStructure(fileBuffer: Buffer): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

      if (workbook.SheetNames.length === 0) {
        errors.push('No sheets found in Excel file');
        return { valid: false, errors, warnings };
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

      if (rawData.length === 0) {
        errors.push('Excel file is empty');
        return { valid: false, errors, warnings };
      }

      // Check for required columns
      const firstRow = rawData[0];
      const hasSourcePath =
        'Source Field Path' in firstRow ||
        'sourceFieldPath' in firstRow ||
        'source_path' in firstRow;
      const hasTargetField =
        'Target Field' in firstRow ||
        'targetField' in firstRow ||
        'target_path' in firstRow;

      if (!hasSourcePath) {
        errors.push(
          'Missing required column: Source Field Path (or sourceFieldPath, source_path)',
        );
      }

      if (!hasTargetField) {
        errors.push(
          'Missing required column: Target Field (or targetField, target_path)',
        );
      }

      if (rawData.length > 100) {
        warnings.push(
          `Large file with ${rawData.length} rows. Consider splitting into multiple files.`,
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Failed to validate Excel structure: ${error.message}`);
      return { valid: false, errors, warnings };
    }
  }
}
