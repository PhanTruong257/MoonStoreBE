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

const CHAT_MODEL = 'gemini-2.5-flash';
const MAX_HISTORY_TURNS = 6;
const RETRIEVAL_TOP_K = 5;
const CHUNK_BATCH_SIZE = 20;

const SYSTEM_PROMPT = `Bạn là trợ lý AI của Moon Store - một sàn thương mại điện tử.
Nhiệm vụ: Tư vấn sản phẩm và giải đáp các câu hỏi thường gặp cho khách hàng.

Thông tin chung về Moon Store (dùng để trả lời câu hỏi thường gặp - FAQ):
- Đặt hàng: Thêm sản phẩm vào giỏ, mở giỏ hàng, chọn sản phẩm muốn mua, chọn địa chỉ nhận hàng và phương thức thanh toán rồi bấm đặt hàng. Giỏ hàng có sản phẩm từ nhiều shop sẽ được tách thành các đơn riêng theo từng shop.
- Thanh toán: Hỗ trợ 3 hình thức - COD (thanh toán khi nhận hàng), chuyển khoản qua mã QR, và cổng thanh toán VNPay.
- Voucher: Nhập mã giảm giá ở bước đặt hàng để được giảm giá theo chương trình.
- Theo dõi đơn: Vào mục "Đơn hàng" để xem trạng thái đơn: Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao.
- Đổi/trả hàng: Với đơn đủ điều kiện, mở chi tiết đơn và gửi yêu cầu đổi/trả kèm lý do; người bán sẽ xem xét và phản hồi.
- Đánh giá: Sau khi đơn giao thành công, khách có thể đánh giá sản phẩm bằng số sao và nhận xét.
- Liên hệ người bán: Khách có thể nhắn tin trực tiếp với shop qua tính năng Chat trên trang sản phẩm hoặc trang đơn hàng.

Quy tắc bắt buộc:
- Trả lời câu hỏi về sản phẩm dựa trên thông tin sản phẩm trong phần context bên dưới (nếu có).
- Trả lời câu hỏi chung (đặt hàng, thanh toán, voucher, theo dõi đơn, đổi/trả...) dựa trên phần "Thông tin chung về Moon Store" ở trên.
- Nếu không có thông tin phù hợp, hãy thành thật nói không biết và đề nghị khách liên hệ shop trực tiếp qua tính năng Chat.
- Trả lời ngắn gọn, thân thiện, bằng tiếng Việt.
- Không bịa đặt thông tin về giá, tình trạng hàng, đặc điểm sản phẩm hay chính sách.
- Khi giới thiệu sản phẩm, luôn đề cập tên sản phẩm và giá nếu có.`;

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStoreService
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
      res.write(`data: ${JSON.stringify({ error: 'Có lỗi xảy ra, vui lòng thử lại.' })}\n\n`);
    } finally {
      res.end();
    }
  }

  async indexProducts(): Promise<{ indexed: number; products: number }> {
    this.logger.log('Starting product indexing...');

    const products = await this.prisma.product.findMany({
      // Only products without any embedding yet — avoids re-embedding (and re-spending
      // API quota on) products that are already indexed.
      where: { status: PRODUCT_STATUS.ACTIVE, embeddings: { none: {} } },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        stock: true,
        highlights: true,
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
        const highlights = Array.isArray(product.highlights)
          ? (product.highlights as { label: string; value: string }[])
          : [];
        const highlightLine = highlights.length
          ? `Thông số nổi bật: ${highlights.map((h) => `${h.label}: ${h.value}`).join('; ')}`
          : null;

        chunks.push({
          productId: product.id,
          content: [
            `Sản phẩm: ${product.name}`,
            `Danh mục: ${product.category.name}`,
            `Thương hiệu: ${product.brand.name}`,
            `Shop: ${product.seller.shopName}`,
            `Giá: ${price.toLocaleString('vi-VN')}đ`,
            `Tình trạng: ${inStock ? 'Còn hàng' : 'Hết hàng'}`,
            ...(highlightLine ? [highlightLine] : []),
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
        `Indexed ${Math.min(i + CHUNK_BATCH_SIZE, products.length)}/${products.length} products`
      );
    }

    this.vectorStore.invalidateCache();
    this.logger.log(`Indexing complete: ${indexedChunks} chunks from ${products.length} products`);

    return { indexed: indexedChunks, products: products.length };
  }
}
