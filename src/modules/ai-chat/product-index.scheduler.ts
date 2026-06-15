import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AiChatService } from './ai-chat.service';

/**
 * Periodically indexes products into the vector store so newly created products
 * become searchable by the AI assistant without a manual trigger.
 *
 * `indexProducts()` is incremental (only products without an embedding), so when
 * there is nothing new this makes zero embedding API calls — safe to run often.
 */
@Injectable()
export class ProductIndexScheduler {
  private readonly logger = new Logger(ProductIndexScheduler.name);
  private isRunning = false;

  constructor(private readonly aiChatService: AiChatService) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncNewProducts(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    try {
      const result = await this.aiChatService.indexProducts();
      if (result.products > 0) {
        this.logger.log(
          `Auto-indexed ${result.products} new product(s) (${result.indexed} chunks).`,
        );
      }
    } catch (error) {
      // Best-effort: a failed run (e.g. embedding quota exhausted) must not crash
      // the app. New products will be picked up on the next run.
      this.logger.warn(
        `Auto-index skipped: ${(error as Error).message}`,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
