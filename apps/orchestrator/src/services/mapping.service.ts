import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mapping } from '../entities/mapping.entity';
import { FieldMapping } from '../entities/field-mapping.entity';

export interface CreateMappingDto {
  name: string;
  sourceSystem: string;
  targetSystem: string;
  productLine: string;
  version?: string;
  description?: string;
  creationMethod?: 'manual' | 'excel' | 'ai' | 'text' | 'jira';
  sourceReference?: string;
  sourceContent?: string;
  sessionId?: string;
  fieldMappings?: FieldMappingDto[];
}

export interface FieldMappingDto {
  sourcePath: string;
  targetPath: string;
  transformationType?: string;
  isRequired?: boolean;
  defaultValue?: string;
  transformationConfig?: any;
  validationRules?: any;
  description?: string;
  confidence?: number;
  reasoning?: string;
  // New metadata fields
  dataType?: string;
  fieldDirection?: 'input' | 'output' | 'both';
  fieldIdentifier?: string;
  skipMapping?: boolean;
  skipBehavior?: 'exclude' | 'use_default';
  catalogFieldId?: string;
  sampleInput?: string;
  sampleOutput?: string;
}

@Injectable()
export class MappingService {
  private readonly logger = new Logger(MappingService.name);

  constructor(
    @InjectRepository(Mapping)
    private readonly mappingRepository: Repository<Mapping>,
    @InjectRepository(FieldMapping)
    private readonly fieldMappingRepository: Repository<FieldMapping>,
  ) {}

  async createMapping(dto: CreateMappingDto): Promise<Mapping> {
    this.logger.log(`Creating mapping: ${dto.name}`);

    // Create and save mapping entity
    const savedMapping = await this.mappingRepository.save({
      name: dto.name,
      sourceSystem: dto.sourceSystem,
      targetSystem: dto.targetSystem,
      productLine: dto.productLine,
      version: dto.version || '1.0.0',
      description: dto.description,
      status: 'draft',
      creationMethod: dto.creationMethod,
      sourceReference: dto.sourceReference,
      sourceContent: dto.sourceContent,
      sessionId: dto.sessionId,
    });

    this.logger.log(`Mapping created with ID: ${savedMapping.id}`);

    // Create field mappings if provided
    if (dto.fieldMappings && dto.fieldMappings.length > 0) {
      const fieldMappings = dto.fieldMappings.map((fm) =>
        this.fieldMappingRepository.create({
          mappingId: savedMapping.id,
          sourcePath: fm.sourcePath,
          targetPath: fm.targetPath,
          transformationType: fm.transformationType || 'direct',
          isRequired: fm.isRequired || false,
          defaultValue: fm.defaultValue,
          transformationConfig: fm.transformationConfig,
          validationRules: fm.validationRules,
          description: fm.description || fm.reasoning,
        }),
      );

      await this.fieldMappingRepository.save(fieldMappings);
      this.logger.log(`Created ${fieldMappings.length} field mappings`);
    }

    return savedMapping;
  }

  async getMapping(id: string): Promise<Mapping> {
    const mapping = await this.mappingRepository.findOne({
      where: { id },
    });

    if (!mapping) {
      throw new NotFoundException(`Mapping with ID ${id} not found`);
    }

    return mapping;
  }

  async getMappingWithFields(id: string): Promise<any> {
    const mapping = await this.getMapping(id);

    const fieldMappings = await this.fieldMappingRepository.find({
      where: { mappingId: id },
      order: { createdAt: 'ASC' },
    });

    return {
      ...mapping,
      fieldMappings,
    };
  }

  async listMappings(filters?: {
    sourceSystem?: string;
    targetSystem?: string;
    productLine?: string;
    status?: string;
  }): Promise<Mapping[]> {
    const query = this.mappingRepository.createQueryBuilder('mapping');

    if (filters?.sourceSystem) {
      query.andWhere('mapping.source_system = :sourceSystem', {
        sourceSystem: filters.sourceSystem,
      });
    }

    if (filters?.targetSystem) {
      query.andWhere('mapping.target_system = :targetSystem', {
        targetSystem: filters.targetSystem,
      });
    }

    if (filters?.productLine) {
      query.andWhere('mapping.product_line = :productLine', {
        productLine: filters.productLine,
      });
    }

    if (filters?.status) {
      query.andWhere('mapping.status = :status', { status: filters.status });
    }

    query.orderBy('mapping.created_at', 'DESC');

    return query.getMany();
  }

  async updateMapping(id: string, updates: Partial<CreateMappingDto>): Promise<Mapping> {
    const mapping = await this.getMapping(id);

    Object.assign(mapping, updates);
    return this.mappingRepository.save(mapping);
  }

  async deleteMapping(id: string): Promise<void> {
    const mapping = await this.getMapping(id);
    await this.mappingRepository.remove(mapping);
    this.logger.log(`Mapping deleted: ${id}`);
  }

  async addFieldMapping(mappingId: string, fieldDto: FieldMappingDto): Promise<FieldMapping> {
    // Verify mapping exists
    await this.getMapping(mappingId);

    const fieldMapping = this.fieldMappingRepository.create({
      mappingId,
      sourcePath: fieldDto.sourcePath,
      targetPath: fieldDto.targetPath,
      transformationType: fieldDto.transformationType || 'direct',
      isRequired: fieldDto.isRequired || false,
      defaultValue: fieldDto.defaultValue,
      transformationConfig: fieldDto.transformationConfig,
      validationRules: fieldDto.validationRules,
      description: fieldDto.description,
      // New metadata fields
      dataType: fieldDto.dataType,
      fieldDirection: fieldDto.fieldDirection || 'both',
      fieldIdentifier: fieldDto.fieldIdentifier,
      skipMapping: fieldDto.skipMapping || false,
      skipBehavior: fieldDto.skipBehavior || 'exclude',
      catalogFieldId: fieldDto.catalogFieldId,
      sampleInput: fieldDto.sampleInput,
      sampleOutput: fieldDto.sampleOutput,
    });

    return this.fieldMappingRepository.save(fieldMapping);
  }

  async updateFieldMapping(
    fieldMappingId: string,
    updates: Partial<FieldMappingDto>,
  ): Promise<FieldMapping> {
    const fieldMapping = await this.fieldMappingRepository.findOne({
      where: { id: fieldMappingId },
    });

    if (!fieldMapping) {
      throw new NotFoundException(
        `Field mapping with ID ${fieldMappingId} not found`,
      );
    }

    // Update fields if provided
    if (updates.sourcePath !== undefined) {
      fieldMapping.sourcePath = updates.sourcePath;
    }
    if (updates.targetPath !== undefined) {
      fieldMapping.targetPath = updates.targetPath;
    }
    if (updates.transformationType !== undefined) {
      fieldMapping.transformationType = updates.transformationType;
    }
    if (updates.isRequired !== undefined) {
      fieldMapping.isRequired = updates.isRequired;
    }
    if (updates.defaultValue !== undefined) {
      fieldMapping.defaultValue = updates.defaultValue;
    }
    if (updates.transformationConfig !== undefined) {
      fieldMapping.transformationConfig = updates.transformationConfig;
    }
    if (updates.validationRules !== undefined) {
      fieldMapping.validationRules = updates.validationRules;
    }
    if (updates.description !== undefined) {
      fieldMapping.description = updates.description;
    }
    // Update new metadata fields
    if (updates.dataType !== undefined) {
      fieldMapping.dataType = updates.dataType;
    }
    if (updates.fieldDirection !== undefined) {
      fieldMapping.fieldDirection = updates.fieldDirection;
    }
    if (updates.fieldIdentifier !== undefined) {
      fieldMapping.fieldIdentifier = updates.fieldIdentifier;
    }
    if (updates.skipMapping !== undefined) {
      fieldMapping.skipMapping = updates.skipMapping;
    }
    if (updates.skipBehavior !== undefined) {
      fieldMapping.skipBehavior = updates.skipBehavior;
    }
    if (updates.catalogFieldId !== undefined) {
      fieldMapping.catalogFieldId = updates.catalogFieldId;
    }
    if (updates.sampleInput !== undefined) {
      fieldMapping.sampleInput = updates.sampleInput;
    }
    if (updates.sampleOutput !== undefined) {
      fieldMapping.sampleOutput = updates.sampleOutput;
    }

    return this.fieldMappingRepository.save(fieldMapping);
  }

  async deleteFieldMapping(fieldMappingId: string): Promise<void> {
    await this.fieldMappingRepository.delete(fieldMappingId);
  }

  async testMapping(mappingId: string, sourceData: any): Promise<any> {
    this.logger.log(`Testing mapping ${mappingId}`);

    // Get mapping with field mappings
    const mapping = await this.getMappingWithFields(mappingId);

    if (!mapping.fieldMappings || mapping.fieldMappings.length === 0) {
      this.logger.warn('No field mappings configured for this mapping');
      return {};
    }

    const result: any = {};

    // Apply each field mapping
    for (const fieldMapping of mapping.fieldMappings) {
      try {
        const value = this.extractValueFromSource(
          sourceData,
          fieldMapping.sourcePath,
        );

        if (value !== undefined || fieldMapping.defaultValue !== undefined) {
          this.setValueInTarget(
            result,
            fieldMapping.targetPath,
            value !== undefined ? value : fieldMapping.defaultValue,
          );
        } else if (fieldMapping.isRequired) {
          this.logger.warn(
            `Required field ${fieldMapping.targetPath} has no value`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error processing field mapping ${fieldMapping.id}: ${error.message}`,
        );
      }
    }

    return result;
  }

  private extractValueFromSource(sourceData: any, path: string): any {
    // Handle JSONPath (simplified - handles $.path.to.field)
    if (path.startsWith('$.')) {
      const parts = path.substring(2).split('.');
      let value = sourceData;

      for (const part of parts) {
        if (value === undefined || value === null) {
          return undefined;
        }
        value = value[part];
      }

      return value;
    }

    // Handle simple property access
    return sourceData[path];
  }

  private setValueInTarget(target: any, path: string, value: any): void {
    // Handle nested paths (e.g., "insured.name")
    const parts = path.split('.');

    if (parts.length === 1) {
      target[path] = value;
      return;
    }

    let current = target;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }
}
