import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../modules/auth/entities/user.entity';
import { Conversation } from '../modules/conversations/entities/conversation.entity';
import { Dealer } from '../modules/dealers/entities/dealer.entity';
import { Distributor } from '../modules/distributors/entities/distributor.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { Product } from '../modules/products/entities/product.entity';
import { getSslOption } from './ssl.util';

/** Used by the TypeORM CLI (migration:generate/run/revert) and by seed.ts. */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: getSslOption(process.env.DATABASE_URL ?? ''),
  entities: [Distributor, Dealer, Product, Order, Conversation, User],
  // __dirname-relative + dual extension so this resolves whether it's run via
  // ts-node (dev, this file is src/database/*.ts) or as compiled output
  // (prod, this file is dist/database/*.js and migrations are .js too).
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});
