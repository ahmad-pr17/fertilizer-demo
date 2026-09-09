import { Injectable } from '@nestjs/common';
import { ConversationsService } from '../conversations/conversations.service';
import { DealersService } from '../dealers/dealers.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly dealersService: DealersService,
    private readonly ordersService: OrdersService,
    private readonly whatsappService: WhatsappService,
  ) {}

  getEscalations(distributorId: string) {
    return this.conversationsService.findEscalated(distributorId);
  }

  getLlmUsageSummary(distributorId: string) {
    return this.conversationsService.getLlmUsageSummary(distributorId);
  }

  getOrderFeed(distributorId: string) {
    return this.ordersService.findRecent(distributorId);
  }

  async replyToEscalation(distributorId: string, conversationId: string, reply: string) {
    const conversation = await this.conversationsService.findOneOrFail(
      distributorId,
      conversationId,
    );
    await this.whatsappService.sendTextMessage(conversation.whatsappNumber, reply);
    return this.conversationsService.resolveWithHumanReply(distributorId, conversationId, reply);
  }

  async updateOrderStatus(distributorId: string, orderId: string, status: OrderStatus) {
    return this.ordersService.setStatus(distributorId, orderId, status);
  }

  async getDealerActivity(distributorId: string, dealerId: string) {
    // Confirms the dealer belongs to this distributor before returning anything.
    const dealer = await this.dealersService.findOneOrFail(distributorId, dealerId);
    const [orders, conversations] = await Promise.all([
      this.ordersService.findRecentForDealer(distributorId, dealerId),
      this.conversationsService.findRecentForDealer(distributorId, dealerId),
    ]);
    return {
      dealer: {
        id: dealer.id,
        name: dealer.name,
        whatsappNumber: dealer.whatsappNumber,
        region: dealer.region,
        creditLimit: dealer.creditLimit,
        currentBalance: dealer.currentBalance,
      },
      orders,
      conversations,
    };
  }

  /**
   * Retention on request: purges this distributor's conversation log entirely.
   * Scheduled purge (age-based) lives in modules/retention.
   */
  async deleteDistributorConversationData(distributorId: string): Promise<{ deleted: number }> {
    const deleted = await this.conversationsService.purgeAllForDistributor(distributorId);
    return { deleted };
  }
}
