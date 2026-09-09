import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { DealersModule } from '../dealers/dealers.module';
import { OrdersModule } from '../orders/orders.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ConversationsModule, DealersModule, OrdersModule, WhatsappModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
