import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductLineConfig } from '../../entities/product-line-config.entity';
import {
  CreateProductLineConfigDto,
  UpdateProductLineConfigDto,
  ProductLineConfigEntity,
} from '@rating-poc/shared-types';

@Injectable()
export class ProductLinesService {
  private configCache: Map<string, ProductLineConfig> = new Map();
  private readonly CACHE_TTL = 60000; // 60 seconds

  constructor(
    @InjectRepository(ProductLineConfig)
    private readonly configRepository: Repository<ProductLineConfig>,
  ) {}

  /**
   * Get all product line configurations
   * @param includeTemplates - Include template configurations
   * @param status - Filter by status
   */
  async findAll(
    includeTemplates = false,
    status?: string,
  ): Promise<ProductLineConfig[]> {
    const query = this.configRepository.createQueryBuilder('config');

    if (!includeTemplates) {
      query.where('config.is_template = :isTemplate', { isTemplate: false });
    }

    if (status) {
      query.andWhere('config.status = :status', { status });
    }

    query.orderBy('config.created_at', 'DESC');

    return query.getMany();
  }

  /**
   * Get templates only
   */
  async findTemplates(): Promise<ProductLineConfig[]> {
    return this.configRepository.find({
      where: { isTemplate: true, status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get product line configuration by code (with caching)
   * @param code - Product line code
   */
  async findByCode(code: string): Promise<ProductLineConfig> {
    // Check cache first
    const cached = this.configCache.get(code);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const config = await this.configRepository.findOne({
      where: { code },
    });

    if (!config) {
      throw new NotFoundException(`Product line configuration '${code}' not found`);
    }

    // Cache for future requests
    this.configCache.set(code, config);
    setTimeout(() => this.configCache.delete(code), this.CACHE_TTL);

    return config;
  }

  /**
   * Get product line configuration by ID
   * @param id - Product line config ID
   */
  async findById(id: string): Promise<ProductLineConfig> {
    const config = await this.configRepository.findOne({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`Product line configuration with ID '${id}' not found`);
    }

    return config;
  }

  /**
   * Create a new product line configuration
   * @param createDto - Product line configuration data
   */
  async create(createDto: CreateProductLineConfigDto): Promise<ProductLineConfig> {
    // Check if code already exists
    const existing = await this.configRepository.findOne({
      where: { code: createDto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Product line configuration with code '${createDto.code}' already exists`,
      );
    }

    // Validate configuration structure
    this.validateConfiguration(createDto.config);

    // Create entity
    const config = this.configRepository.create(createDto);

    // Save to database
    const saved = await this.configRepository.save(config);

    // Clear cache
    this.configCache.delete(createDto.code);

    return saved;
  }

  /**
   * Update product line configuration
   * @param code - Product line code
   * @param updateDto - Updated configuration data
   */
  async update(
    code: string,
    updateDto: UpdateProductLineConfigDto,
  ): Promise<ProductLineConfig> {
    // Check if exists
    const existing = await this.findByCode(code);

    // Validate configuration if provided
    if (updateDto.config) {
      this.validateConfiguration(updateDto.config);
    }

    // Update entity
    Object.assign(existing, updateDto);

    // Save to database
    const updated = await this.configRepository.save(existing);

    // Clear cache
    this.configCache.delete(code);

    return updated;
  }

  /**
   * Delete (soft delete by setting status to archived)
   * @param code - Product line code
   */
  async delete(code: string): Promise<void> {
    const config = await this.findByCode(code);

    config.status = 'archived';
    await this.configRepository.save(config);

    // Clear cache
    this.configCache.delete(code);
  }

  /**
   * Validate product line configuration structure
   * @param config - Configuration object to validate
   */
  private validateConfiguration(config: any): void {
    // Check required sections
    const requiredSections = ['productLine', 'integrations', 'workflow', 'features', 'api'];

    for (const section of requiredSections) {
      if (!config[section]) {
        throw new BadRequestException(
          `Configuration is missing required section: ${section}`,
        );
      }
    }

    // Validate productLine section
    if (!config.productLine.code || !config.productLine.name) {
      throw new BadRequestException(
        'Configuration productLine section must include code and name',
      );
    }

    // Validate workflow has steps
    if (!config.workflow.steps || !Array.isArray(config.workflow.steps)) {
      throw new BadRequestException('Configuration workflow must include steps array');
    }

    // Validate integrations
    if (!config.integrations.sourceSystem || !config.integrations.targetSystems) {
      throw new BadRequestException(
        'Configuration integrations must include sourceSystem and targetSystems',
      );
    }
  }

  /**
   * Clear all cached configurations
   */
  clearCache(): void {
    this.configCache.clear();
  }
}
