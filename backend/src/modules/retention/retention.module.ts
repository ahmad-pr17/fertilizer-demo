import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { DistributorsModule } from '../distributors/distributors.module';
import { RetentionService } from './retention.service';

@Module({
  imports: [DistributorsModule, ConversationsModule],
  providers: [RetentionService],
})
export class RetentionModule {}
