export type UserRole = 'owner' | 'ops';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  distributorId: string;
}

export type OrderStatus =
  | 'pending_confirmation'
  | 'escalated'
  | 'confirmed'
  | 'rejected'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending_confirmation',
  'escalated',
  'confirmed',
  'rejected',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export interface OrderLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

export interface Order {
  id: string;
  dealerId: string;
  items: OrderLineItem[];
  totalAmount: number | null;
  status: OrderStatus;
  deliveryAddress: string | null;
  paymentTerms: string | null;
  escalationReason: string | null;
  createdAt: string;
}

export type ConversationStatus = 'handled_by_agent' | 'escalated' | 'resolved_by_human';

export interface ParsedIntent {
  intent: string;
  confidence: number;
  reasoning?: string;
  entities?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  dealerId: string | null;
  whatsappNumber: string;
  rawMessage: string;
  parsedIntent: ParsedIntent | null;
  status: ConversationStatus;
  escalationReason: string | null;
  humanReply: string | null;
  createdAt: string;
}

export interface Dealer {
  id: string;
  name: string;
  whatsappNumber: string;
  region: string;
  creditLimit: number;
  currentBalance: number;
}

export interface DealerActivity {
  dealer: Dealer;
  orders: Order[];
  conversations: Conversation[];
}

export interface LlmUsageSummary {
  classifiedMessageCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
}
