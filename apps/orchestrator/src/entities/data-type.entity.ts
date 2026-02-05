import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('data_types')
export class DataType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'type_name', length: 50, unique: true })
  typeName: string;

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ name: 'validation_pattern', type: 'text', nullable: true })
  validationPattern?: string;

  @Column({ name: 'example_value', type: 'text', nullable: true })
  exampleValue?: string;

  @Column({ name: 'is_system', default: true })
  isSystem: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
