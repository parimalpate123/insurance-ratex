import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mapping } from '../../entities/mapping.entity';
import { FieldMapping } from '../../entities/field-mapping.entity';

@Injectable()
export class MappingsService {
  private readonly logger = new Logger(MappingsService.name);

  constructor(
    @InjectRepository(Mapping)
    private readonly mappingRepository: Repository<Mapping>,
    @InjectRepository(FieldMapping)
    private readonly fieldMappingRepository: Repository<FieldMapping>,
  ) {}

  /**
   * Get mappings for a specific product line
   */
  async getMappingsByProductLine(productLineCode: string): Promise<Mapping[]> {
    return this.mappingRepository.find({
      where: { productLineCode },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get active mapping for product line and system pair
   */
  async getActiveMappingForProductLine(
    productLineCode: string,
    sourceSystem: string,
    targetSystem: string,
  ): Promise<Mapping | null> {
    return this.mappingRepository.findOne({
      where: {
        productLineCode,
        sourceSystem,
        targetSystem,
        status: 'active',
      },
      relations: ['fieldMappings'],
    });
  }

  /**
   * Transform data using mappings for a product line
   */
  async transformData(
    productLineCode: string,
    sourceSystem: string,
    targetSystem: string,
    sourceData: any,
  ): Promise<any> {
    this.logger.log(
      `Transforming data for ${productLineCode}: ${sourceSystem} → ${targetSystem}`,
    );

    // Get active mapping
    const mapping = await this.getActiveMappingForProductLine(
      productLineCode,
      sourceSystem,
      targetSystem,
    );

    if (!mapping) {
      this.logger.warn(
        `No active mapping found for ${productLineCode} (${sourceSystem} → ${targetSystem}), passing through`,
      );
      return sourceData;
    }

    if (!mapping.fieldMappings || mapping.fieldMappings.length === 0) {
      this.logger.warn(`Mapping ${mapping.id} has no field mappings, passing through`);
      return sourceData;
    }

    // Execute field mappings
    const targetData: any = {};

    for (const fieldMapping of mapping.fieldMappings) {
      if (fieldMapping.skipMapping) {
        continue;
      }

      try {
        const sourceValue = this.getNestedValue(sourceData, fieldMapping.sourcePath);
        const transformedValue = this.transformValue(
          sourceValue,
          fieldMapping,
        );

        this.setNestedValue(targetData, fieldMapping.targetPath, transformedValue);
      } catch (error: any) {
        this.logger.error(
          `Error mapping ${fieldMapping.sourcePath} → ${fieldMapping.targetPath}: ${error.message}`,
        );

        if (fieldMapping.isRequired && !fieldMapping.defaultValue) {
          throw error;
        }

        // Use default value if available
        if (fieldMapping.defaultValue) {
          this.setNestedValue(
            targetData,
            fieldMapping.targetPath,
            fieldMapping.defaultValue,
          );
        }
      }
    }

    this.logger.log(`Transformation complete: ${mapping.fieldMappings.length} fields mapped`);

    return targetData;
  }

  /**
   * Get nested value from object using dot notation path
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Set nested value in object using dot notation path
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    if (!path) return;

    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Transform value based on transformation type
   */
  private transformValue(value: any, fieldMapping: FieldMapping): any {
    if (value === null || value === undefined) {
      return fieldMapping.defaultValue || value;
    }

    switch (fieldMapping.transformationType) {
      case 'direct':
        return value;

      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;

      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;

      case 'trim':
        return typeof value === 'string' ? value.trim() : value;

      case 'number':
        return Number(value);

      case 'string':
        return String(value);

      case 'boolean':
        return Boolean(value);

      case 'date':
        return new Date(value).toISOString();

      case 'custom':
        return this.applyCustomTransformation(value, fieldMapping.transformationConfig);

      default:
        this.logger.warn(`Unknown transformation type: ${fieldMapping.transformationType}`);
        return value;
    }
  }

  /**
   * Apply custom transformation logic
   */
  private applyCustomTransformation(value: any, config: any): any {
    // TODO: Implement custom transformation logic based on config
    // For now, just return the value
    return value;
  }
}
