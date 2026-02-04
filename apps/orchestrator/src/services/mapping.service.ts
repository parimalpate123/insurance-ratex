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
  creationMethod?: 'manual' | 'excel' | 'ai' | 'text';
  sourceReference?: string;
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
    });

    return this.fieldMappingRepository.save(fieldMapping);
  }

  async deleteFieldMapping(fieldMappingId: string): Promise<void> {
    await this.fieldMappingRepository.delete(fieldMappingId);
  }
}
