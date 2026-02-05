import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataType } from '../entities/data-type.entity';

export interface CreateDataTypeDto {
  typeName: string;
  displayName: string;
  validationPattern?: string;
  exampleValue?: string;
}

@Injectable()
export class DataTypesService {
  private readonly logger = new Logger(DataTypesService.name);

  constructor(
    @InjectRepository(DataType)
    private readonly dataTypeRepository: Repository<DataType>,
  ) {}

  async findAll(): Promise<DataType[]> {
    return this.dataTypeRepository.find({
      order: { displayName: 'ASC' },
    });
  }

  async findById(id: string): Promise<DataType> {
    const dataType = await this.dataTypeRepository.findOne({
      where: { id },
    });

    if (!dataType) {
      throw new NotFoundException(`Data type with ID ${id} not found`);
    }

    return dataType;
  }

  async create(dto: CreateDataTypeDto): Promise<DataType> {
    this.logger.log(`Creating data type: ${dto.typeName}`);

    const dataType = this.dataTypeRepository.create({
      ...dto,
      isSystem: false, // User-created types are not system types
    });

    return this.dataTypeRepository.save(dataType);
  }

  async update(
    id: string,
    updates: Partial<CreateDataTypeDto>,
  ): Promise<DataType> {
    const dataType = await this.findById(id);

    // Don't allow updating system types
    if (dataType.isSystem) {
      throw new Error('Cannot update system data types');
    }

    Object.assign(dataType, updates);
    return this.dataTypeRepository.save(dataType);
  }

  async delete(id: string): Promise<void> {
    const dataType = await this.findById(id);

    // Don't allow deleting system types
    if (dataType.isSystem) {
      throw new Error('Cannot delete system data types');
    }

    await this.dataTypeRepository.remove(dataType);
    this.logger.log(`Data type deleted: ${id}`);
  }
}
