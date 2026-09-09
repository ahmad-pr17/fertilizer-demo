import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { encryptedNumberTransformer } from '../../../common/transformers/encrypted-column.transformer';

export enum OrderStatus {
  PENDING_CONFIRMATION = 'pending_confirmation',
  ESCALATED = 'escalated',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'distributor_id' })
  @Index()
  distributorId!: string;

  @Column({ name: 'dealer_id' })
  @Index()
  dealerId!: string;

  @Column({ type: 'jsonb' })
  items!: OrderLineItem[];

  /** Total order value — derived from encrypted product prices, so encrypted too */
  @Column({
    name: 'total_amount',
    type: 'text',
    nullable: true,
    transformer: encryptedNumberTransformer,
  })
  totalAmount!: number | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_CONFIRMATION,
  })
  status!: OrderStatus;

  @Column({ name: 'delivery_address', type: 'varchar', nullable: true })
  deliveryAddress!: string | null;

  @Column({ name: 'payment_terms', type: 'varchar', nullable: true })
  paymentTerms!: string | null;

  /** Set when status is ESCALATED — why a human needs to look at this */
  @Column({ name: 'escalation_reason', type: 'varchar', nullable: true })
  escalationReason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
