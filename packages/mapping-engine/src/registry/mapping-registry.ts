/**
 * Mapping Registry - Store and retrieve mapping configurations
 */

import { MappingConfiguration, MappingDirection } from '../types/mapping.types';

export class MappingRegistry {
  private mappings: Map<string, MappingConfiguration> = new Map();

  /**
   * Register a mapping configuration
   */
  register(config: MappingConfiguration): void {
    const key = this.createKey(
      config.sourceSystem,
      config.targetSystem,
      config.productLine,
      config.direction
    );

    if (this.mappings.has(key)) {
      throw new Error(
        `Mapping already exists: ${config.sourceSystem} -> ${config.targetSystem} for ${config.productLine}`
      );
    }

    this.mappings.set(key, config);
  }

  /**
   * Update an existing mapping configuration
   */
  update(config: MappingConfiguration): void {
    const key = this.createKey(
      config.sourceSystem,
      config.targetSystem,
      config.productLine,
      config.direction
    );

    if (!this.mappings.has(key)) {
      throw new Error(
        `Mapping not found: ${config.sourceSystem} -> ${config.targetSystem} for ${config.productLine}`
      );
    }

    this.mappings.set(key, config);
  }

  /**
   * Get a mapping configuration
   */
  get(
    sourceSystem: string,
    targetSystem: string,
    productLine: string,
    direction: MappingDirection
  ): MappingConfiguration | undefined {
    const key = this.createKey(sourceSystem, targetSystem, productLine, direction);
    return this.mappings.get(key);
  }

  /**
   * Get mapping by ID
   */
  getById(id: string): MappingConfiguration | undefined {
    for (const mapping of this.mappings.values()) {
      if (mapping.id === id) {
        return mapping;
      }
    }
    return undefined;
  }

  /**
   * Check if a mapping exists
   */
  has(
    sourceSystem: string,
    targetSystem: string,
    productLine: string,
    direction: MappingDirection
  ): boolean {
    const key = this.createKey(sourceSystem, targetSystem, productLine, direction);
    return this.mappings.has(key);
  }

  /**
   * Delete a mapping
   */
  delete(
    sourceSystem: string,
    targetSystem: string,
    productLine: string,
    direction: MappingDirection
  ): boolean {
    const key = this.createKey(sourceSystem, targetSystem, productLine, direction);
    return this.mappings.delete(key);
  }

  /**
   * List all mappings for a source system
   */
  listBySourceSystem(sourceSystem: string): MappingConfiguration[] {
    return Array.from(this.mappings.values()).filter(
      (m) => m.sourceSystem === sourceSystem
    );
  }

  /**
   * List all mappings for a target system
   */
  listByTargetSystem(targetSystem: string): MappingConfiguration[] {
    return Array.from(this.mappings.values()).filter(
      (m) => m.targetSystem === targetSystem
    );
  }

  /**
   * List all mappings for a product line
   */
  listByProductLine(productLine: string): MappingConfiguration[] {
    return Array.from(this.mappings.values()).filter(
      (m) => m.productLine === productLine
    );
  }

  /**
   * List all mappings
   */
  listAll(): MappingConfiguration[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Clear all mappings
   */
  clear(): void {
    this.mappings.clear();
  }

  /**
   * Get mapping count
   */
  count(): number {
    return this.mappings.size;
  }

  /**
   * Load mappings from JSON
   */
  loadFromJSON(configs: MappingConfiguration[]): void {
    configs.forEach((config) => {
      try {
        this.register(config);
      } catch (error) {
        // If already exists, update instead
        this.update(config);
      }
    });
  }

  /**
   * Export mappings to JSON
   */
  exportToJSON(): MappingConfiguration[] {
    return this.listAll();
  }

  /**
   * Create a unique key for a mapping
   */
  private createKey(
    sourceSystem: string,
    targetSystem: string,
    productLine: string,
    direction: MappingDirection
  ): string {
    return `${sourceSystem}:${targetSystem}:${productLine}:${direction}`;
  }
}

// Singleton instance
export const mappingRegistry = new MappingRegistry();
