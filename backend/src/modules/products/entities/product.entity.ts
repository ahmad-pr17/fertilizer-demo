import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { encryptedNumberTransformer } from '../../../common/transformers/encrypted-column.transformer';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'distributor_id' })
  @Index()
  distributorId!: string;

  @Column()
  name!: string;

  /** e.g. "50kg bag", "ton" — used both for display and LLM entity matching */
  @Column()
  unit!: string;

  @Column({
    type: 'text',
    transformer: encryptedNumberTransformer,
  })
  price!: number;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
