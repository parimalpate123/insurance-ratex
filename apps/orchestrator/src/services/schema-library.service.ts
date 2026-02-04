import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schema, SchemaType, SchemaData } from '../entities/schema.entity';

export interface SchemaListItem {
  id: string;
  systemName: string;
  version: string;
  schemaType: SchemaType;
  description?: string;
  fieldCount: number;
}

@Injectable()
export class SchemaLibraryService {
  private readonly logger = new Logger(SchemaLibraryService.name);

  constructor(
    @InjectRepository(Schema)
    private readonly schemaRepository: Repository<Schema>,
  ) {}

  /**
   * Get all available schemas
   */
  async listSchemas(systemName?: string): Promise<SchemaListItem[]> {
    const queryBuilder = this.schemaRepository.createQueryBuilder('schema');

    if (systemName) {
      queryBuilder.where('schema.systemName = :systemName', { systemName });
    }

    const schemas = await queryBuilder
      .orderBy('schema.systemName', 'ASC')
      .addOrderBy('schema.version', 'DESC')
      .getMany();

    return schemas.map((schema) => ({
      id: schema.id,
      systemName: schema.systemName,
      version: schema.version,
      schemaType: schema.schemaType,
      description: schema.description,
      fieldCount: schema.schemaData.fields?.length || 0,
    }));
  }

  /**
   * Get schema by ID
   */
  async getSchemaById(id: string): Promise<Schema> {
    const schema = await this.schemaRepository.findOne({ where: { id } });

    if (!schema) {
      throw new NotFoundException(`Schema with ID ${id} not found`);
    }

    return schema;
  }

  /**
   * Get schema by system name and version
   */
  async getSchema(systemName: string, version: string): Promise<Schema> {
    const schema = await this.schemaRepository.findOne({
      where: { systemName, version },
    });

    if (!schema) {
      throw new NotFoundException(
        `Schema for ${systemName} v${version} not found`,
      );
    }

    return schema;
  }

  /**
   * Get latest version of a schema
   */
  async getLatestSchema(systemName: string): Promise<Schema> {
    const schema = await this.schemaRepository.findOne({
      where: { systemName },
      order: { version: 'DESC' },
    });

    if (!schema) {
      throw new NotFoundException(`No schema found for ${systemName}`);
    }

    return schema;
  }

  /**
   * Create or update a schema
   */
  async saveSchema(
    systemName: string,
    version: string,
    schemaType: SchemaType,
    schemaData: SchemaData,
    description?: string,
    createdBy?: string,
  ): Promise<Schema> {
    this.logger.log(
      `Saving schema: ${systemName} v${version} (${schemaType})`,
    );

    // Check if schema already exists
    const existing = await this.schemaRepository.findOne({
      where: { systemName, version },
    });

    if (existing) {
      // Update existing
      existing.schemaData = schemaData;
      existing.description = description;
      existing.schemaType = schemaType;
      return await this.schemaRepository.save(existing);
    }

    // Create new
    const schema = this.schemaRepository.create({
      systemName,
      version,
      schemaType,
      schemaData,
      description,
      createdBy,
    });

    return await this.schemaRepository.save(schema);
  }

  /**
   * Upload custom schema from JSON
   */
  async uploadCustomSchema(
    systemName: string,
    version: string,
    schemaJson: any,
    description?: string,
    createdBy?: string,
  ): Promise<Schema> {
    this.logger.log(`Uploading custom schema: ${systemName} v${version}`);

    // Validate schema structure
    this.validateSchemaStructure(schemaJson);

    return await this.saveSchema(
      systemName,
      version,
      'custom',
      schemaJson,
      description,
      createdBy,
    );
  }

  /**
   * Validate schema structure
   */
  private validateSchemaStructure(schemaData: any): void {
    if (!schemaData.fields || !Array.isArray(schemaData.fields)) {
      throw new Error('Schema must have a "fields" array');
    }

    for (const field of schemaData.fields) {
      if (!field.path) {
        throw new Error('Each field must have a "path" property');
      }
      if (!field.type) {
        throw new Error('Each field must have a "type" property');
      }
    }
  }

  /**
   * Search fields across schemas
   */
  async searchFields(
    searchTerm: string,
    systemName?: string,
  ): Promise<
    Array<{
      schemaId: string;
      systemName: string;
      version: string;
      field: any;
    }>
  > {
    const queryBuilder = this.schemaRepository.createQueryBuilder('schema');

    if (systemName) {
      queryBuilder.where('schema.systemName = :systemName', { systemName });
    }

    const schemas = await queryBuilder.getMany();
    const results: Array<{
      schemaId: string;
      systemName: string;
      version: string;
      field: any;
    }> = [];

    const searchLower = searchTerm.toLowerCase();

    for (const schema of schemas) {
      for (const field of schema.schemaData.fields || []) {
        if (
          field.path.toLowerCase().includes(searchLower) ||
          field.description?.toLowerCase().includes(searchLower)
        ) {
          results.push({
            schemaId: schema.id,
            systemName: schema.systemName,
            version: schema.version,
            field,
          });
        }
      }
    }

    return results;
  }

  /**
   * Compare two schemas
   */
  async compareSchemas(
    schema1Id: string,
    schema2Id: string,
  ): Promise<{
    commonFields: string[];
    onlyInSchema1: string[];
    onlyInSchema2: string[];
    typeMismatches: Array<{ path: string; type1: string; type2: string }>;
  }> {
    const schema1 = await this.getSchemaById(schema1Id);
    const schema2 = await this.getSchemaById(schema2Id);

    const fields1 = new Map(
      schema1.schemaData.fields.map((f) => [f.path, f.type]),
    );
    const fields2 = new Map(
      schema2.schemaData.fields.map((f) => [f.path, f.type]),
    );

    const commonFields: string[] = [];
    const onlyInSchema1: string[] = [];
    const typeMismatches: Array<{ path: string; type1: string; type2: string }> =
      [];

    for (const [path, type1] of fields1) {
      if (fields2.has(path)) {
        commonFields.push(path);
        const type2 = fields2.get(path);
        if (type1 !== type2) {
          typeMismatches.push({ path, type1, type2 });
        }
      } else {
        onlyInSchema1.push(path);
      }
    }

    const onlyInSchema2 = Array.from(fields2.keys()).filter(
      (path) => !fields1.has(path),
    );

    return {
      commonFields,
      onlyInSchema1,
      onlyInSchema2,
      typeMismatches,
    };
  }

  /**
   * Delete a schema
   */
  async deleteSchema(id: string): Promise<void> {
    const result = await this.schemaRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Schema with ID ${id} not found`);
    }

    this.logger.log(`Deleted schema: ${id}`);
  }
}
