import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TenantScopedRepository } from '../../common/services/tenant-scoped.repository';
import {
  Conversation,
  ConversationStatus,
} from './entities/conversation.entity';

@Injectable()
export class ConversationsService extends TenantScopedRepository<Conversation> {
  constructor(
    @InjectRepository(Conversation) repository: Repository<Conversation>,
  ) {
    super(repository);
  }

  findEscalated(distributorId: string): Promise<Conversation[]> {
    return this.repository.find({
      where: { distributorId, status: ConversationStatus.ESCALATED },
      order: { createdAt: 'ASC' },
    });
  }

  findRecentForDealer(
    distributorId: string,
    dealerId: string,
    limit = 50,
  ): Promise<Conversation[]> {
    return this.repository.find({
      where: { distributorId, dealerId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async resolveWithHumanReply(
    distributorId: string,
    id: string,
    humanReply: string,
  ): Promise<Conversation> {
    return this.update(distributorId, id, {
      humanReply,
      status: ConversationStatus.RESOLVED_BY_HUMAN,
    });
  }

  /**
   * Sums the real per-call cost the LLM module recorded on each conversation
   * (see LlmService.computeUsage) — actual spend from Anthropic's own
   * reported token usage, not an estimate.
   */
  async getLlmUsageSummary(distributorId: string): Promise<{
    classifiedMessageCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
  }> {
    const conversations = await this.repository.find({
      where: { distributorId },
      select: ['parsedIntent'],
    });

    let classifiedMessageCount = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;

    for (const conversation of conversations) {
      const usage = (conversation.parsedIntent as any)?.usage;
      if (!usage) continue;
      classifiedMessageCount += 1;
      totalInputTokens += usage.inputTokens ?? 0;
      totalOutputTokens += usage.outputTokens ?? 0;
      totalCostUsd += usage.costUsd ?? 0;
    }

    return { classifiedMessageCount, totalInputTokens, totalOutputTokens, totalCostUsd };
  }

  /** Retention policy enforcement — see modules/retention */
  async purgeOlderThan(distributorId: string, cutoff: Date): Promise<number> {
    const result = await this.repository.delete({
      distributorId,
      createdAt: LessThan(cutoff),
    });
    return result.affected ?? 0;
  }

  async purgeAllForDistributor(distributorId: string): Promise<number> {
    const result = await this.repository.delete({ distributorId });
    return result.affected ?? 0;
  }
}
