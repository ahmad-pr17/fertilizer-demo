import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationsService } from '../conversations/conversations.service';
import {
  ConversationIntent,
  ConversationStatus,
  MessageDirection,
} from '../conversations/entities/conversation.entity';
import { Dealer } from '../dealers/entities/dealer.entity';
import { DealersService } from '../dealers/dealers.service';
import { DistributorsService } from '../distributors/distributors.service';
import { LlmService } from '../llm/llm.service';
import { OrderStatus } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { IncomingWhatsappMessage } from '../whatsapp/whatsapp.types';

/**
 * The single place order-placement business rules live. Deliberately plain,
 * boring TypeScript — not prompt engineering — because these are exactly the
 * decisions the spec says must never be left to the model's judgment.
 */
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly distributorsService: DistributorsService,
    private readonly dealersService: DealersService,
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
    private readonly conversationsService: ConversationsService,
    private readonly llmService: LlmService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async handleIncomingMessage(message: IncomingWhatsappMessage): Promise<void> {
    const distributor = await this.distributorsService.findByWhatsappPhoneNumberId(
      message.phoneNumberId,
    );
    if (!distributor) {
      this.logger.warn(
        `Received WhatsApp message for unknown phone_number_id ${message.phoneNumberId}`,
      );
      return;
    }
    const distributorId = distributor.id;

    const dealer = await this.dealersService.findByWhatsappNumber(distributorId, message.from);
    if (!dealer) {
      await this.conversationsService.create(distributorId, {
        dealerId: null,
        whatsappNumber: message.from,
        direction: MessageDirection.INBOUND,
        rawMessage: message.text,
        parsedIntent: null,
        status: ConversationStatus.ESCALATED,
        escalationReason: 'Message from a WhatsApp number not registered to any known dealer',
      } as any);
      await this.reply(
        message.from,
        "Thanks for your message. We don't have this number on file yet — a team member will follow up shortly to get you set up.",
      );
      return;
    }

    const catalog = await this.productsService.findActive(distributorId);
    // Recent turns give the model conversation memory — without this, a
    // follow-up that only supplies a missing detail (e.g. just an address)
    // looks like a stray, context-free message and gets misclassified.
    const recentHistory = await this.conversationsService.findRecentForDealer(
      distributorId,
      dealer.id,
      5,
    );
    const history = recentHistory
      .slice()
      .reverse()
      .map((c) => ({ rawMessage: c.rawMessage, parsedIntent: c.parsedIntent }));
    const parsed = await this.llmService.parseMessage(
      message.text,
      catalog.map((p) => ({ id: p.id, name: p.name, unit: p.unit })),
      history,
    );

    const minConfidence = this.config.get<number>('ESCALATION_MIN_CONFIDENCE', 0.75);

    const conversation = await this.conversationsService.create(distributorId, {
      dealerId: dealer.id,
      whatsappNumber: message.from,
      direction: MessageDirection.INBOUND,
      rawMessage: message.text,
      parsedIntent: parsed,
      status: ConversationStatus.HANDLED_BY_AGENT,
    } as any);

    if (parsed.confidence < minConfidence) {
      await this.escalate(
        distributorId,
        conversation.id,
        message.from,
        `Low intent-classification confidence (${parsed.confidence.toFixed(2)})`,
      );
      return;
    }

    switch (parsed.intent) {
      case ConversationIntent.PRICE_QUERY:
        return this.handlePriceQuery(distributorId, conversation.id, message.from, catalog, parsed);
      case ConversationIntent.CREDIT_CHECK:
        return this.handleCreditCheck(message.from, dealer);
      case ConversationIntent.DELIVERY_STATUS:
        return this.handleDeliveryStatus(distributorId, message.from, dealer.id);
      case ConversationIntent.ORDER_PLACEMENT:
        return this.handleOrderPlacement(distributorId, conversation.id, message.from, dealer, catalog, parsed);
      case ConversationIntent.COMPLAINT:
        return this.escalate(distributorId, conversation.id, message.from, 'Complaint — needs human handling');
      case ConversationIntent.UNCLEAR:
      default:
        return this.escalate(distributorId, conversation.id, message.from, 'Intent could not be classified');
    }
  }

  private async handlePriceQuery(
    distributorId: string,
    conversationId: string,
    whatsappNumber: string,
    catalog: Awaited<ReturnType<ProductsService['findActive']>>,
    parsed: Awaited<ReturnType<LlmService['parseMessage']>>,
  ): Promise<void> {
    if (!parsed.entities.productMatchedInCatalog || !parsed.entities.productName) {
      await this.escalate(
        distributorId,
        conversationId,
        whatsappNumber,
        'Price query — product could not be matched to the catalog',
      );
      return;
    }
    const product = catalog.find((p) => p.name === parsed.entities.productName);
    if (!product) {
      await this.escalate(
        distributorId,
        conversationId,
        whatsappNumber,
        'Price query — model-matched product not found in catalog lookup',
      );
      return;
    }
    await this.reply(
      whatsappNumber,
      `${product.name}: Rs. ${product.price.toLocaleString()} per ${product.unit}.`,
    );
  }

  private async handleCreditCheck(whatsappNumber: string, dealer: Dealer): Promise<void> {
    const available = dealer.creditLimit - dealer.currentBalance;
    await this.reply(
      whatsappNumber,
      `Your credit limit: Rs. ${dealer.creditLimit.toLocaleString()}. ` +
        `Current balance: Rs. ${dealer.currentBalance.toLocaleString()}. ` +
        `Available credit: Rs. ${available.toLocaleString()}.`,
    );
  }

  private async handleDeliveryStatus(
    distributorId: string,
    whatsappNumber: string,
    dealerId: string,
  ): Promise<void> {
    const [latest] = await this.ordersService.findRecentForDealer(distributorId, dealerId, 1);
    if (!latest) {
      await this.reply(whatsappNumber, "We don't have any orders on file for you yet.");
      return;
    }
    await this.reply(
      whatsappNumber,
      `Your most recent order (placed ${latest.createdAt.toLocaleDateString()}) status: ${latest.status.replace(/_/g, ' ')}.`,
    );
  }

  private async handleOrderPlacement(
    distributorId: string,
    conversationId: string,
    whatsappNumber: string,
    dealer: Dealer,
    catalog: Awaited<ReturnType<ProductsService['findActive']>>,
    parsed: Awaited<ReturnType<LlmService['parseMessage']>>,
  ): Promise<void> {
    const { productName, productMatchedInCatalog, quantity, deliveryAddress, paymentTerms } =
      parsed.entities;

    if (!productMatchedInCatalog || !productName) {
      await this.escalate(
        distributorId,
        conversationId,
        whatsappNumber,
        'Order placement — product could not be matched to the catalog',
      );
      return;
    }
    const product = catalog.find((p) => p.name === productName);
    if (!product) {
      await this.escalate(
        distributorId,
        conversationId,
        whatsappNumber,
        'Order placement — model-matched product not found in catalog lookup',
      );
      return;
    }

    if (!quantity || quantity <= 0) {
      await this.reply(
        whatsappNumber,
        `How many ${product.unit}(s) of ${product.name} would you like to order?`,
      );
      return;
    }

    const maxQuantity = this.config.get<number>('ESCALATION_MAX_QUANTITY_UNITS', 500);
    if (quantity > maxQuantity) {
      await this.escalate(
        distributorId,
        conversationId,
        whatsappNumber,
        `Unusual order quantity (${quantity} ${product.unit}, exceeds ${maxQuantity})`,
      );
      return;
    }

    if (!deliveryAddress) {
      await this.reply(whatsappNumber, 'What delivery address should we use for this order?');
      return;
    }
    if (!paymentTerms) {
      await this.reply(
        whatsappNumber,
        'What payment terms — cash on delivery, or credit? If credit, how many days?',
      );
      return;
    }

    const lineTotal = product.price * quantity;
    const projectedBalance = dealer.currentBalance + lineTotal;
    if (projectedBalance > dealer.creditLimit) {
      await this.escalate(
        distributorId,
        conversationId,
        whatsappNumber,
        `Order of Rs. ${lineTotal.toLocaleString()} would exceed available credit ` +
          `(limit Rs. ${dealer.creditLimit.toLocaleString()}, current balance Rs. ${dealer.currentBalance.toLocaleString()})`,
      );
      return;
    }

    const order = await this.ordersService.create(distributorId, {
      dealerId: dealer.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity,
          unit: product.unit,
        },
      ],
      totalAmount: lineTotal,
      status: OrderStatus.PENDING_CONFIRMATION,
      deliveryAddress,
      paymentTerms,
    } as any);

    await this.conversationsService.update(distributorId, conversationId, {
      relatedOrderId: order.id,
    } as any);

    await this.reply(
      whatsappNumber,
      `Order received: ${quantity} ${product.unit}(s) of ${product.name}, total Rs. ${lineTotal.toLocaleString()}. ` +
        `Delivery to: ${deliveryAddress}. Payment: ${paymentTerms}. ` +
        `Our team will confirm shortly.`,
    );
  }

  private async escalate(
    distributorId: string,
    conversationId: string,
    whatsappNumber: string,
    reason: string,
  ): Promise<void> {
    await this.conversationsService.update(distributorId, conversationId, {
      status: ConversationStatus.ESCALATED,
      escalationReason: reason,
    } as any);
    this.logger.log(`Escalated conversation ${conversationId}: ${reason}`);
    await this.reply(
      whatsappNumber,
      "Thanks — let me check on that and a team member will get back to you shortly.",
    );
  }

  private async reply(whatsappNumber: string, text: string): Promise<void> {
    try {
      await this.whatsappService.sendTextMessage(whatsappNumber, text);
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp reply: ${(error as Error).message}`);
    }
  }
}
