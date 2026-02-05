import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { FieldCatalog } from '../entities/field-catalog.entity';

export interface CreateFieldCatalogDto {
  fieldName: string;
  displayName: string;
  dataType: string;
  category?: string;
  description?: string;
  sampleValue?: string;
  isRequired?: boolean;
}

@Injectable()
export class FieldCatalogService {
  private readonly logger = new Logger(FieldCatalogService.name);

  constructor(
    @InjectRepository(FieldCatalog)
    private readonly fieldCatalogRepository: Repository<FieldCatalog>,
  ) {}

  async findAll(filters?: {
    category?: string;
    dataType?: string;
    search?: string;
  }): Promise<FieldCatalog[]> {
    const query = this.fieldCatalogRepository.createQueryBuilder('field');

    if (filters?.category) {
      query.andWhere('field.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.dataType) {
      query.andWhere('field.data_type = :dataType', {
        dataType: filters.dataType,
      });
    }

    if (filters?.search) {
      query.andWhere(
        '(field.field_name ILIKE :search OR field.display_name ILIKE :search OR field.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('field.category', 'ASC').addOrderBy('field.display_name', 'ASC');

    return query.getMany();
  }

  async findByCategory(category: string): Promise<FieldCatalog[]> {
    return this.fieldCatalogRepository.find({
      where: { category },
      order: { displayName: 'ASC' },
    });
  }

  async findById(id: string): Promise<FieldCatalog> {
    const field = await this.fieldCatalogRepository.findOne({
      where: { id },
    });

    if (!field) {
      throw new NotFoundException(`Field catalog entry with ID ${id} not found`);
    }

    return field;
  }

  async create(dto: CreateFieldCatalogDto): Promise<FieldCatalog> {
    this.logger.log(`Creating field catalog entry: ${dto.fieldName}`);

    const field = this.fieldCatalogRepository.create({
      ...dto,
      isSystem: false, // User-created fields are not system fields
    });

    return this.fieldCatalogRepository.save(field);
  }

  async update(
    id: string,
    updates: Partial<CreateFieldCatalogDto>,
  ): Promise<FieldCatalog> {
    const field = await this.findById(id);

    // Don't allow updating system fields
    if (field.isSystem) {
      throw new Error('Cannot update system field catalog entries');
    }

    Object.assign(field, updates);
    return this.fieldCatalogRepository.save(field);
  }

  async delete(id: string): Promise<void> {
    const field = await this.findById(id);

    // Don't allow deleting system fields
    if (field.isSystem) {
      throw new Error('Cannot delete system field catalog entries');
    }

    await this.fieldCatalogRepository.remove(field);
    this.logger.log(`Field catalog entry deleted: ${id}`);
  }

  async getCategories(): Promise<string[]> {
    const result = await this.fieldCatalogRepository
      .createQueryBuilder('field')
      .select('DISTINCT field.category', 'category')
      .where('field.category IS NOT NULL')
      .orderBy('field.category', 'ASC')
      .getRawMany();

    return result.map((r) => r.category);
  }
}
