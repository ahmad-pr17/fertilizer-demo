import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum ConversationIntent {
  PRICE_QUERY = 'price_query',
  ORDER_PLACEMENT = 'order_placement',
  DELIVERY_STATUS = 'delivery_status',
  CREDIT_CHECK = 'credit_check',
  COMPLAINT = 'complaint',
  UNCLEAR = 'unclear',
}

export enum ConversationStatus {
  HANDLED_BY_AGENT = 'handled_by_agent',
  ESCALATED = 'escalated',
  RESOLVED_BY_HUMAN = 'resolved_by_human',
}

export interface ParsedIntent {
  intent: ConversationIntent;
  confidence: number;
  entities: Record<string, unknown>;
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'distributor_id' })
  @Index()
  distributorId!: string;

  /** Null until the inbound WhatsApp number is matched to a known dealer */
  @Column({ name: 'dealer_id', type: 'uuid', nullable: true })
  @Index()
  dealerId!: string | null;

  @Column({ name: 'whatsapp_number' })
  whatsappNumber!: string;

  @Column({ type: 'enum', enum: MessageDirection })
  direction!: MessageDirection;

  /**
   * Free-text message body (Urdu/English). Not itself treated as more
   * sensitive than the rest of the conversation log, but never printed to
   * application logs — see RedactingLogger — and subject to the same
   * retention policy as everything else in this table.
   */
  @Column({ name: 'raw_message', type: 'text' })
  rawMessage!: string;

  @Column({ name: 'parsed_intent', type: 'jsonb', nullable: true })
  parsedIntent!: ParsedIntent | null;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.HANDLED_BY_AGENT,
  })
  status!: ConversationStatus;

  @Column({ name: 'related_order_id', type: 'uuid', nullable: true })
  relatedOrderId!: string | null;

  /** Set when status is ESCALATED — why the agent didn't handle this itself */
  @Column({ name: 'escalation_reason', type: 'varchar', nullable: true })
  escalationReason!: string | null;

  @Column({ name: 'human_reply', type: 'text', nullable: true })
  humanReply!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
