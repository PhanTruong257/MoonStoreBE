import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import type { Content } from '@google/genai';
import type { Response } from 'express';

import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumberOrZero } from '../../common/utils/decimal.helper';
import { PRODUCT_STATUS } from '../../common/constants';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import type { AiChatHistoryItem } from './dto/ai-chat.dto';

const CHAT_MODEL = 'gemini-2.0-flash';
const MAX_HISTORY_TURNS = 6;
const RETRIEVAL_TOP_K = 5;
const CHUNK_BATCH_SIZE = 20;

const SYSTEM_PROMPT = `Bạn là trợ lý AI của Moon Store - một sàn thương mại điện tử.
Nhiệm vụ: Tư vấn và hỗ trợ khách hàng tìm kiếm sản phẩm phù hợp.

Quy tắc bắt buộc:
- Chỉ trả lời dựa trên thông tin sản phẩm được cung cấp trong context.
- Nếu không có thông tin phù hợp, hãy thành thật nói không biết và đề nghị khách liên hệ shop trực tiếp qua tính năng Chat trên trang sản phẩm.
- Trả lời ngắn gọn, thân thiện, bằng tiếng Việt.
- Không bịa đặt thông tin về giá, tình trạng hàng hay đặc điểm sản phẩm.
- Khi giới thiệu sản phẩm, luôn đề cập tên sản phẩm và giá nếu có.`;

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStoreService,
  ) {}

  async streamChat(message: string, history: AiChatHistoryItem[], res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const queryVector = await this.embeddingService.embedText(message);
      const results = await this.vectorStore.search(queryVector, RETRIEVAL_TOP_K);

      const context = results.map((r) => r.content).join('\n\n---\n\n');

      const systemInstruction = context
        ? `${SYSTEM_PROMPT}\n\nThông tin sản phẩm liên quan từ Moon Store:\n\n${context}`
        : SYSTEM_PROMPT;

      // Chuyển history từ OpenAI format → Gemini format (assistant → model)
      const contents: Content[] = history.slice(-MAX_HISTORY_TURNS).map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      }));

      contents.push({ role: 'user', parts: [{ text: message }] });

      const stream = await this.ai.models.generateContentStream({
        model: CHAT_MODEL,
        config: {
          systemInstruction,
          maxOutputTokens: 600,
          temperature: 0.3,
        },
        contents,
      });

      for await (const chunk of stream) {
        const text = chunk.text ?? '';
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
    } catch (error) {
      this.logger.error('AI chat stream error', error);
      res.write(
        `data: ${JSON.stringify({ error: 'Có lỗi xảy ra, vui lòng thử lại.' })}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  async indexProducts(): Promise<{ indexed: number; products: number }> {
    this.logger.log('Starting product indexing...');

    const products = await this.prisma.product.findMany({
      where: { status: PRODUCT_STATUS.ACTIVE },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        stock: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        seller: { select: { shopName: true } },
      },
    });

    this.logger.log(`Found ${products.length} active products to index`);

    let indexedChunks = 0;

    for (let i = 0; i < products.length; i += CHUNK_BATCH_SIZE) {
      const batch = products.slice(i, i + CHUNK_BATCH_SIZE);
      const chunks: { productId: number; content: string }[] = [];

      for (const product of batch) {
        const price = decimalToNumberOrZero(product.basePrice);
        const inStock = product.stock > 0;

        chunks.push({
          productId: product.id,
          content: [
            `Sản phẩm: ${product.name}`,
            `Danh mục: ${product.category.name}`,
            `Thương hiệu: ${product.brand.name}`,
            `Shop: ${product.seller.shopName}`,
            `Giá: ${price.toLocaleString('vi-VN')}đ`,
            `Tình trạng: ${inStock ? 'Còn hàng' : 'Hết hàng'}`,
          ].join('\n'),
        });

        if (product.description?.trim()) {
          chunks.push({
            productId: product.id,
            content: `${product.name}: ${product.description.trim()}`,
          });
        }
      }

      const vectors = await this.embeddingService.embedBatch(chunks.map((c) => c.content));

      for (let j = 0; j < chunks.length; j++) {
        await this.vectorStore.upsertEmbedding(chunks[j].productId, chunks[j].content, vectors[j]);
        indexedChunks++;
      }

      this.logger.log(
        `Indexed ${Math.min(i + CHUNK_BATCH_SIZE, products.length)}/${products.length} products`,
      );
    }

    this.vectorStore.invalidateCache();
    this.logger.log(`Indexing complete: ${indexedChunks} chunks from ${products.length} products`);

    return { indexed: indexedChunks, products: products.length };
  }
}
