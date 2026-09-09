import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ConversationIntent } from '../conversations/entities/conversation.entity';
import { LlmUsage, ParsedMessage, ProductCatalogEntry } from './intent.types';

const VALID_INTENTS = new Set(Object.values(ConversationIntent));

/**
 * claude-haiku-4-5 published per-token pricing (USD per token, i.e. per-MTok
 * price / 1,000,000) — see platform.claude.com/docs/en/about-claude/pricing.
 * Update these if the model or its pricing changes.
 */
const HAIKU_4_5_PRICE_PER_TOKEN = {
  input: 1 / 1_000_000,
  output: 5 / 1_000_000,
  cacheWrite5m: 1.25 / 1_000_000,
  cacheRead: 0.1 / 1_000_000,
};

/** One prior inbound message from this dealer, oldest-first, for conversation continuity. */
export interface ConversationTurn {
  rawMessage: string;
  parsedIntent: unknown;
}

/**
 * Intent classification + entity extraction only. This service NEVER decides
 * money- or credit-related outcomes (whether an order is within credit limit,
 * what a price is) — it only reads the dealer's free-text message and the
 * product catalog it's given, and returns a structured guess. All financial
 * logic and thresholds live in AgentService, in plain TypeScript, so they're
 * auditable and can't be talked around by a cleverly worded WhatsApp message.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const workspaceId = this.config.get<string>('ANTHROPIC_WORKSPACE_ID');
    this.client = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
      // Required when the API key is org-scoped rather than workspace-scoped —
      // tells Anthropic which workspace's billing/limits this call counts against.
      defaultHeaders: workspaceId ? { 'anthropic-workspace-id': workspaceId } : undefined,
    });
    this.model = this.config.get<string>('LLM_MODEL', 'claude-haiku-4-5');
  }

  async parseMessage(
    message: string,
    catalog: ProductCatalogEntry[],
    history: ConversationTurn[] = [],
  ): Promise<ParsedMessage> {
    const systemPrompt = this.buildSystemPrompt(catalog);

    // Replay recent turns as real conversation history (the model's own past
    // JSON responses come back as "assistant" turns) so a follow-up message
    // that only supplies a missing detail — e.g. just an address — is
    // understood as continuing the order in progress, not a fresh message
    // classified in a vacuum.
    const historyMessages: Anthropic.MessageParam[] = [];
    for (const turn of history) {
      if (!turn.parsedIntent) continue;
      historyMessages.push({ role: 'user', content: turn.rawMessage });
      historyMessages.push({ role: 'assistant', content: JSON.stringify(turn.parsedIntent) });
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 512,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            // Product catalog is stable across messages for a given
            // distributor within the cache TTL — cache it to cut cost/latency
            // on every routine message.
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [...historyMessages, { role: 'user', content: message }],
      });

      const usage = this.computeUsage(response.usage);

      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text',
      );
      if (!textBlock) {
        return { ...this.unclearFallback('Model returned no text block'), usage };
      }
      return { ...this.parseModelJson(textBlock.text), usage };
    } catch (error) {
      this.logger.error(`LLM classification failed: ${(error as Error).message}`);
      return this.unclearFallback('LLM request failed');
    }
  }

  private buildSystemPrompt(catalog: ProductCatalogEntry[]): string {
    const catalogLines = catalog
      .map((p) => `- ${p.name} (unit: ${p.unit})`)
      .join('\n');

    return [
      'You are an intent classifier for a fertilizer distributor\'s WhatsApp dealer ordering line.',
      'Dealers write in Urdu, English, or a mix (Roman Urdu). Read the message and respond with ONLY a JSON object — no markdown, no prose, no code fences.',
      '',
      'The distributor\'s current product catalog is:',
      catalogLines || '(no active products configured)',
      '',
      'Classify the message into exactly one intent:',
      '- price_query: asking the price of one or more products',
      '- order_placement: wants to place/confirm an order (product + quantity)',
      '- delivery_status: asking about the status of an existing order/delivery',
      '- credit_check: asking about their credit limit or account balance',
      '- complaint: reporting a problem (bad product, wrong delivery, damaged goods, etc.)',
      '- unclear: anything you cannot confidently classify, or a message unrelated to these',
      '',
      'Respond with exactly this JSON shape:',
      '{',
      '  "intent": "price_query" | "order_placement" | "delivery_status" | "credit_check" | "complaint" | "unclear",',
      '  "confidence": <number 0 to 1, your genuine confidence>,',
      '  "entities": {',
      '    "productName": <string, EXACTLY as it appears in the catalog above, or omit if none/unmatched>,',
      '    "productMatchedInCatalog": <true only if productName is an exact catalog match>,',
      '    "quantity": <number, if a quantity was mentioned>,',
      '    "deliveryAddress": <string, if mentioned>,',
      '    "paymentTerms": <string, if mentioned, e.g. "cash", "30 days credit">',
      '  },',
      '  "reasoning": <one short sentence explaining your classification>',
      '}',
      '',
      'Be conservative: if the product name is ambiguous, or ordering intent is unclear, ' +
        'set productMatchedInCatalog to false and lower your confidence rather than guessing. ' +
        'You are never asked to state a price, credit limit, or balance — never invent one.',
      '',
      'This conversation may include earlier turns from the same dealer (your own prior JSON ' +
        'replies appear as earlier assistant turns). If the latest message only supplies a detail ' +
        'that was still missing from an order already in progress — e.g. just a delivery address, ' +
        'or just payment terms, with no product mentioned — treat it as continuing that order: ' +
        'classify it as order_placement and carry forward the productName, quantity, ' +
        'deliveryAddress, and paymentTerms already established earlier, merged with whatever the ' +
        'latest message adds. Only start a fresh order (ignoring earlier turns) if the latest ' +
        'message clearly names a different product or otherwise begins a new request.',
    ].join('\n');
  }

  private parseModelJson(rawText: string): ParsedMessage {
    let jsonText = rawText.trim();
    // Defensive: strip a code fence if the model added one despite instructions
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) jsonText = fenceMatch[1].trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return this.unclearFallback('Model response was not valid JSON');
    }

    const intent: ConversationIntent = VALID_INTENTS.has(parsed.intent)
      ? parsed.intent
      : ConversationIntent.UNCLEAR;
    const confidence =
      typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1
        ? parsed.confidence
        : 0;

    return {
      intent,
      confidence,
      entities: {
        productName: parsed.entities?.productName,
        productMatchedInCatalog: Boolean(parsed.entities?.productMatchedInCatalog),
        quantity:
          typeof parsed.entities?.quantity === 'number' ? parsed.entities.quantity : undefined,
        deliveryAddress: parsed.entities?.deliveryAddress,
        paymentTerms: parsed.entities?.paymentTerms,
      },
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
  }

  private computeUsage(usage: Anthropic.Usage): LlmUsage {
    const inputTokens = usage.input_tokens;
    const outputTokens = usage.output_tokens;
    const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
    const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0;
    const costUsd =
      inputTokens * HAIKU_4_5_PRICE_PER_TOKEN.input +
      outputTokens * HAIKU_4_5_PRICE_PER_TOKEN.output +
      cacheReadTokens * HAIKU_4_5_PRICE_PER_TOKEN.cacheRead +
      cacheWriteTokens * HAIKU_4_5_PRICE_PER_TOKEN.cacheWrite5m;
    return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, costUsd };
  }

  private unclearFallback(reason: string): ParsedMessage {
    return {
      intent: ConversationIntent.UNCLEAR,
      confidence: 0,
      entities: {},
      reasoning: reason,
    };
  }
}
