import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import type { Content, Part } from '@google/genai';
import type { Response } from 'express';

import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumberOrZero } from '../../common/utils/decimal.helper';
import { isQuotaError } from '../../common/utils/ai-error.helper';
import { getGeminiChatModel, PRODUCT_STATUS } from '../../common/constants';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { OrderToolsService } from './tools/order-tools.service';
import { ORDER_TOOL_DECLARATIONS } from './tools/tool-declarations';
import type { AiChatHistoryItem } from './dto/ai-chat.dto';
import type { AgentProduct, OrderDraft } from './dto/order-draft.dto';

const MAX_HISTORY_TURNS = 6;
const RETRIEVAL_TOP_K = 5;
const CHUNK_BATCH_SIZE = 20;
const MAX_TOOL_ITERATIONS = 6;

const SYSTEM_PROMPT = `Bạn là trợ lý AI của Moon Store - một sàn thương mại điện tử.
Nhiệm vụ: Tư vấn sản phẩm và giải đáp các câu hỏi thường gặp cho khách hàng.

Thông tin chung về Moon Store (dùng để trả lời câu hỏi thường gặp - FAQ):
- Đặt hàng: Thêm sản phẩm vào giỏ, mở giỏ hàng, chọn sản phẩm muốn mua, chọn địa chỉ nhận hàng và phương thức thanh toán rồi bấm đặt hàng. Giỏ hàng có sản phẩm từ nhiều shop sẽ được tách thành các đơn riêng theo từng shop.
- Đăng nhập: Cần đăng nhập tài khoản để đặt hàng và theo dõi đơn.
- Thanh toán: Hỗ trợ cổng thanh toán VNPay.
- Voucher: Nhập mã giảm giá ở bước đặt hàng để được giảm giá theo chương trình. Voucher có thể giảm theo phần trăm hoặc số tiền cố định, có giới hạn sử dụng và hạn dùng. Nếu quên áp voucher lúc đặt hàng, khách liên hệ shop để được hỗ trợ.
- Phí vận chuyển: Hiển thị ở bước đặt hàng theo từng đơn.
- Theo dõi đơn: Vào mục "Đơn hàng" để xem trạng thái đơn: Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao. Thời gian giao tùy người bán xác nhận và đơn vị vận chuyển.
- Hủy đơn: Có thể hủy khi đơn còn ở trạng thái "Chờ xác nhận".
- Đổi/trả hàng: Với đơn đã giao thành công và đủ điều kiện, mở chi tiết đơn và gửi yêu cầu đổi/trả kèm lý do (có thể đính kèm ảnh); người bán sẽ xem xét và phản hồi. Với yêu cầu trả hàng được duyệt, admin xử lý hoàn tiền cho khách.
- Đánh giá: Sau khi đơn giao thành công, khách có thể đánh giá sản phẩm bằng số sao và nhận xét; đánh giá đã gửi có thể cập nhật lại.
- Liên hệ người bán: Khách có thể nhắn tin trực tiếp với shop qua tính năng Chat trên trang sản phẩm hoặc trang đơn hàng.
- Trở thành người bán: Đăng ký gian hàng; hồ sơ chờ admin duyệt rồi mới bán được.

Hướng dẫn thao tác trên website (dùng để trả lời câu hỏi "làm sao để..."):
- Thêm vào giỏ: Mở trang chi tiết sản phẩm, chọn tùy chọn (nếu có) rồi bấm "Thêm vào giỏ".
- Tìm sản phẩm theo danh mục: Dùng bộ lọc danh mục ở trang danh sách sản phẩm.
- Chỉnh số lượng / xóa sản phẩm trong giỏ: Mở giỏ hàng, tăng/giảm số lượng hoặc bấm xóa ở từng item.
- Đăng ký tài khoản: Vào trang Đăng ký, nhập email, mật khẩu, họ tên.
- Đổi mật khẩu / cập nhật hồ sơ: Vào trang hồ sơ cá nhân.
- Quản lý địa chỉ giao hàng: Vào hồ sơ cá nhân / mục địa chỉ để thêm địa chỉ mới hoặc chọn "Đặt làm mặc định".
- Xem đơn đã mua / chi tiết đơn: Vào mục "Đơn hàng", bấm vào đơn để xem chi tiết.
- Mở chat với shop: Bấm nút Chat trên trang sản phẩm hoặc trang đơn hàng.

Quy tắc bắt buộc:
- Trả lời câu hỏi về sản phẩm dựa trên thông tin sản phẩm trong phần context bên dưới (nếu có).
- Trả lời câu hỏi chung và hướng dẫn thao tác dựa trên phần "Thông tin chung về Moon Store" và "Hướng dẫn thao tác trên website" ở trên.
- Nếu không có thông tin phù hợp, hãy thành thật nói không biết và đề nghị khách liên hệ shop trực tiếp qua tính năng Chat. Tuyệt đối không bịa ra tính năng hoặc thao tác mà phần hướng dẫn ở trên không nhắc tới.
- Trả lời ngắn gọn, thân thiện, bằng tiếng Việt.
- Không bịa đặt thông tin về giá, tình trạng hàng, đặc điểm sản phẩm hay chính sách.
- Khi giới thiệu sản phẩm, luôn đề cập tên sản phẩm và giá nếu có.`;

const AGENT_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

KHẢ NĂNG ĐẶT HÀNG QUA CHAT (dùng tools):
- Khi khách muốn tìm/mua: dùng tool searchProducts để tìm sản phẩm thật trên sàn (không bịa).
- Khi sản phẩm có tùy chọn (size/màu) hoặc cần xác nhận giá/tồn kho: dùng getProductDetail.
- Khi khách đưa mã giảm giá: dùng validateVoucher.
- Khi đã rõ sản phẩm + số lượng khách muốn mua: gọi proposeOrder để tạo BẢN NHÁP đơn.
- TUYỆT ĐỐI KHÔNG được nói "đã đặt hàng thành công". proposeOrder chỉ tạo bản nháp; khách sẽ bấm nút để sang trang thanh toán và tự hoàn tất.
- Nếu khách chưa đăng nhập, hãy mời khách đăng nhập trước khi đặt.
- Trước khi gọi proposeOrder, xác nhận lại ngắn gọn tên sản phẩm và số lượng với khách.
- Sau khi gọi proposeOrder, trả lời ngắn gọn mời khách kiểm tra thông tin trong thẻ và bấm "Tới trang thanh toán".`;

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
  });
  // Đọc lúc khởi tạo service (sau khi .env đã nạp) để lấy đúng GEMINI_CHAT_MODEL.
  private readonly chatModel = getGeminiChatModel();

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStoreService,
    private readonly orderTools: OrderToolsService,
  ) {}

  async streamChat(
    message: string,
    history: AiChatHistoryItem[],
    res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const queryVector = await this.embeddingService.embedText(message);
      const results = await this.vectorStore.search(
        queryVector,
        RETRIEVAL_TOP_K,
      );

      const context = results.map((r) => r.content).join('\n\n---\n\n');

      const systemInstruction = context
        ? `${SYSTEM_PROMPT}\n\nThông tin sản phẩm liên quan từ Moon Store:\n\n${context}`
        : SYSTEM_PROMPT;

      // Gửi kèm các sản phẩm liên quan (kèm id/ảnh/giá) để FE render link + card.
      // Giữ thứ tự theo độ liên quan của retrieval, dedup theo productId.
      const orderedProductIds = [...new Set(results.map((r) => r.productId))];
      if (orderedProductIds.length) {
        const products = await this.prisma.product.findMany({
          where: { id: { in: orderedProductIds }, status: PRODUCT_STATUS.ACTIVE },
          select: { id: true, name: true, imageUrl: true, basePrice: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        const relatedProducts = orderedProductIds
          .map((id) => productMap.get(id))
          .filter((p): p is NonNullable<typeof p> => Boolean(p))
          .map((p) => ({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl,
            price: decimalToNumberOrZero(p.basePrice),
          }));

        if (relatedProducts.length) {
          res.write(
            `data: ${JSON.stringify({ products: relatedProducts })}\n\n`,
          );
        }
      }

      // Chuyển history từ OpenAI format → Gemini format (assistant → model)
      const contents: Content[] = history
        .slice(-MAX_HISTORY_TURNS)
        .map((item) => ({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content }],
        }));

      contents.push({ role: 'user', parts: [{ text: message }] });

      const stream = await this.ai.models.generateContentStream({
        model: this.chatModel,
        config: {
          systemInstruction,
          maxOutputTokens: 1000,
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

  /**
   * Trợ lý đặt hàng agentic: Gemini tự gọi các tool (tìm SP, voucher, địa chỉ,
   * tạo bản nháp đơn). KHÔNG tạo đơn thật — chỉ trả về orderDraft để khách xác nhận.
   */
  async agentChat(
    userId: number | null,
    message: string,
    history: AiChatHistoryItem[],
  ): Promise<{ text: string; orderDraft?: OrderDraft; products?: AgentProduct[] }> {
    const systemInstruction = `${AGENT_SYSTEM_PROMPT}\n\nTrạng thái phiên: ${
      userId ? 'Khách đã đăng nhập.' : 'Khách CHƯA đăng nhập (không thể đặt hàng).'
    }`;

    const contents: Content[] = history
      .slice(-MAX_HISTORY_TURNS)
      .map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    let orderDraft: OrderDraft | undefined;
    let finalText = '';
    // Gom sản phẩm tìm được qua tool searchProducts để FE render card (dedup theo id).
    const productMap = new Map<number, AgentProduct>();

    try {
      // Vòng lặp function-calling: model gọi tool → ta thực thi → trả kết quả → lặp.
      for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
        const response = await this.ai.models.generateContent({
          model: this.chatModel,
          config: {
            systemInstruction,
            temperature: 0.2,
            tools: [{ functionDeclarations: ORDER_TOOL_DECLARATIONS }],
          },
          contents,
        });

        const calls = response.functionCalls ?? [];
        if (!calls.length) {
          finalText = response.text ?? '';
          break;
        }

        // Ghi lại lượt "model gọi tool" rồi đính kèm kết quả tool cho lượt sau.
        const modelContent = response.candidates?.[0]?.content;
        if (modelContent) contents.push(modelContent);

        const responseParts: Part[] = [];
        for (const call of calls) {
          const result = await this.orderTools.executeTool(
            call.name ?? '',
            call.args ?? {},
            userId,
          );
          if (call.name === 'proposeOrder' && result.orderDraft) {
            orderDraft = result.orderDraft as OrderDraft;
          }
          if (call.name === 'searchProducts' && Array.isArray(result.products)) {
            for (const p of result.products as Array<{
              productId: number;
              name: string;
              imageUrl: string;
              price: number;
            }>) {
              if (!productMap.has(p.productId)) {
                productMap.set(p.productId, {
                  id: p.productId,
                  name: p.name,
                  imageUrl: p.imageUrl,
                  price: p.price,
                });
              }
            }
          }
          responseParts.push({
            functionResponse: { name: call.name ?? '', response: result },
          });
        }
        contents.push({ role: 'user', parts: responseParts });
      }
    } catch (error) {
      this.logger.error('AI agent chat error', error as Error);
      return {
        text: isQuotaError(error)
          ? 'Trợ lý AI đang quá tải hoặc đã hết lượt dùng miễn phí hôm nay. Vui lòng thử lại sau ít phút.'
          : 'Có lỗi xảy ra, vui lòng thử lại.',
      };
    }

    if (!finalText) {
      finalText = orderDraft
        ? 'Mình đã chuẩn bị đơn hàng bên dưới, bạn kiểm tra rồi bấm "Đặt đơn" để xác nhận nhé.'
        : 'Mình chưa rõ yêu cầu, bạn mô tả lại giúp mình nhé.';
    }

    return {
      text: finalText,
      orderDraft,
      products: productMap.size ? [...productMap.values()] : undefined,
    };
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

      const vectors = await this.embeddingService.embedBatch(
        chunks.map((c) => c.content),
      );

      for (let j = 0; j < chunks.length; j++) {
        await this.vectorStore.upsertEmbedding(
          chunks[j].productId,
          chunks[j].content,
          vectors[j],
        );
        indexedChunks++;
      }

      this.logger.log(
        `Indexed ${Math.min(i + CHUNK_BATCH_SIZE, products.length)}/${products.length} products`,
      );
    }

    this.vectorStore.invalidateCache();
    this.logger.log(
      `Indexing complete: ${indexedChunks} chunks from ${products.length} products`,
    );

    return { indexed: indexedChunks, products: products.length };
  }
}
