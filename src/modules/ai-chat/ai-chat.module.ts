import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { EmbeddingService } from './embedding.service';
import { ProductIndexScheduler } from './product-index.scheduler';
import { VectorStoreService } from './vector-store.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [AiChatController],
  providers: [
    AiChatService,
    EmbeddingService,
    VectorStoreService,
    ProductIndexScheduler,
  ],
})
export class AiChatModule {}
