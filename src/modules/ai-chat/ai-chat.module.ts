import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { VouchersModule } from '../vouchers/vouchers.module';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { EmbeddingService } from './embedding.service';
import { ProductIndexScheduler } from './product-index.scheduler';
import { VectorStoreService } from './vector-store.service';
import { ProductContentService } from './product-content.service';
import { OrderToolsService } from './tools/order-tools.service';

@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET }),
    VouchersModule,
  ],
  controllers: [AiChatController],
  providers: [
    AiChatService,
    EmbeddingService,
    VectorStoreService,
    ProductIndexScheduler,
    OrderToolsService,
    ProductContentService,
  ],
})
export class AiChatModule {}
