import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('systems')
export class SystemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 20, default: 'target' })
  type: 'source' | 'target' | 'both';

  @Column({ length: 20, default: 'rest' })
  protocol: 'rest' | 'soap' | 'mock';

  @Column({ length: 10, default: 'json' })
  format: 'json' | 'xml' | 'soap';

  @Column({ name: 'base_url', type: 'text', nullable: true })
  baseUrl: string;

  @Column({ name: 'auth_config', type: 'jsonb', default: {} })
  authConfig: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  headers: Record<string, any>;

  @Column({ name: 'is_mock', default: false })
  isMock: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
