import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { DealersModule } from '../dealers/dealers.module';
import { DistributorsModule } from '../distributors/distributors.module';
import { LlmModule } from '../llm/llm.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AgentService } from './agent.service';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';

@Module({
  imports: [
    DistributorsModule,
    DealersModule,
    ProductsModule,
    OrdersModule,
    ConversationsModule,
    LlmModule,
    WhatsappModule,
  ],
  controllers: [WhatsappWebhookController],
  providers: [AgentService],
})
export class AgentModule {}
