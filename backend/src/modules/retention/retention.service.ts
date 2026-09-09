import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConversationsService } from '../conversations/conversations.service';
import { DistributorsService } from '../distributors/distributors.service';

/**
 * Enforces CONVERSATION_RETENTION_DAYS (default 90) by deleting conversation
 * log rows older than the cutoff, once a day, for every distributor.
 */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly distributorsService: DistributorsService,
    private readonly conversationsService: ConversationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredConversations(): Promise<void> {
    const retentionDays = this.config.get<number>('CONVERSATION_RETENTION_DAYS', 90);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const distributors = await this.distributorsService.findAll();
    for (const distributor of distributors) {
      const deleted = await this.conversationsService.purgeOlderThan(distributor.id, cutoff);
      if (deleted > 0) {
        this.logger.log(
          `Purged ${deleted} conversation(s) older than ${retentionDays}d for distributor ${distributor.id}`,
        );
      }
    }
  }
}
