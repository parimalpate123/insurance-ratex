import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductLineConfiguration, ConfigStatus } from '@rating-poc/shared-types';

@Entity('product_line_configs')
@Index(['code'], { unique: true })
@Index(['status'])
@Index(['isTemplate'])
@Index(['createdAt'])
export class ProductLineConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb' })
  config: ProductLineConfiguration;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: ConfigStatus;

  @Column({ length: 20, default: '1.0.0' })
  version: string;

  @Column({ name: 'product_owner', length: 255, nullable: true })
  productOwner?: string;

  @Column({ name: 'technical_lead', length: 255, nullable: true })
  technicalLead?: string;

  @Column({ name: 'parent_template_id', type: 'uuid', nullable: true })
  parentTemplateId?: string;

  @Column({ name: 'is_template', default: false })
  isTemplate: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', length: 100, nullable: true })
  updatedBy?: string;
}
