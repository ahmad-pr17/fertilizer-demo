import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('distributors')
export class Distributor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  region!: string;

  /**
   * Meta WhatsApp Cloud API phone_number_id that inbound webhook events for
   * this distributor arrive on — how a single shared webhook endpoint routes
   * an incoming message to the right distributor_id.
   */
  @Column({ name: 'whatsapp_phone_number_id', unique: true })
  whatsappPhoneNumberId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
