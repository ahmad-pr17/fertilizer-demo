import { ConversationIntent } from '../conversations/entities/conversation.entity';

export interface ExtractedOrderEntities {
  /** Best-guess product name as the model matched it against the catalog it was given */
  productName?: string;
  quantity?: number;
  /** True only when the model matched the product unambiguously against the given catalog */
  productMatchedInCatalog?: boolean;
  deliveryAddress?: string;
  paymentTerms?: string;
}

export interface LlmUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** Computed from published Haiku 4.5 per-token pricing at call time */
  costUsd: number;
}

export interface ParsedMessage {
  intent: ConversationIntent;
  /** 0..1 — the model's own confidence in the intent + entity extraction above */
  confidence: number;
  entities: ExtractedOrderEntities;
  /**
   * A short suggested reply for routine cases (price/delivery-status lookups
   * the caller will fill with real data, not the model's own numbers — the
   * model never states a price or balance itself).
   */
  reasoning: string;
  /** Absent on requests that failed before the API returned usage data */
  usage?: LlmUsage;
}

export interface ProductCatalogEntry {
  id: string;
  name: string;
  unit: string;
}
