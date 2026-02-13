import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemEntity } from '../../entities/system.entity';

@Injectable()
export class SystemsService {
  constructor(
    @InjectRepository(SystemEntity)
    private readonly repo: Repository<SystemEntity>,
  ) {}

  findAll(includeInactive = false): Promise<SystemEntity[]> {
    return this.repo.find({
      where: includeInactive ? {} : { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<SystemEntity> {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException(`System ${id} not found`);
    return s;
  }

  async findByCode(code: string): Promise<SystemEntity> {
    const s = await this.repo.findOne({ where: { code } });
    if (!s) throw new NotFoundException(`System '${code}' not found`);
    return s;
  }

  async create(dto: Partial<SystemEntity>): Promise<SystemEntity> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: string, dto: Partial<SystemEntity>): Promise<SystemEntity> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.update(id, { isActive: false });
  }
}
