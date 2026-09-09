import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { encryptedNumberTransformer } from '../../../common/transformers/encrypted-column.transformer';

@Entity('dealers')
@Index(['distributorId', 'whatsappNumber'], { unique: true })
export class Dealer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'distributor_id' })
  @Index()
  distributorId!: string;

  @Column()
  name!: string;

  /** E.164 format, e.g. +923001234567 — matched against inbound WhatsApp sender id */
  @Column({ name: 'whatsapp_number' })
  whatsappNumber!: string;

  @Column()
  region!: string;

  @Column({
    name: 'credit_limit',
    type: 'text',
    transformer: encryptedNumberTransformer,
  })
  creditLimit!: number;

  @Column({
    name: 'current_balance',
    type: 'text',
    transformer: encryptedNumberTransformer,
  })
  currentBalance!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
