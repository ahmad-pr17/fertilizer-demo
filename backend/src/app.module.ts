import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './modules/auth/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AgentModule } from './modules/agent/agent.module';
import { Conversation } from './modules/conversations/entities/conversation.entity';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { Dealer } from './modules/dealers/entities/dealer.entity';
import { DealersModule } from './modules/dealers/dealers.module';
import { Distributor } from './modules/distributors/entities/distributor.entity';
import { DistributorsModule } from './modules/distributors/distributors.module';
import { Order } from './modules/orders/entities/order.entity';
import { OrdersModule } from './modules/orders/orders.module';
import { Product } from './modules/products/entities/product.entity';
import { ProductsModule } from './modules/products/products.module';
import { RetentionModule } from './modules/retention/retention.module';
import { getSslOption } from './database/ssl.util';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('DATABASE_URL');
        return {
          type: 'postgres' as const,
          url,
          ssl: getSslOption(url),
          entities: [Distributor, Dealer, Product, Order, Conversation, User],
          // Schema changes go through migrations only — see src/database/migrations.
          synchronize: false,
        };
      },
    }),
    ScheduleModule.forRoot(),
    DistributorsModule,
    DealersModule,
    ProductsModule,
    OrdersModule,
    ConversationsModule,
    AuthModule,
    AdminModule,
    AgentModule,
    RetentionModule,
  ],
})
export class AppModule {}
