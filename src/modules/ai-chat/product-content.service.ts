import { existsSync, readFileSync } from 'fs';
import { extname, join } from 'path';

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import {
  getActiveSellerIdForUser,
  getUserIdFromRequest,
} from '../../common/auth/request-user.helper';
import { UPLOAD_PRODUCTS_DIR } from '../uploads/uploads.constants';
import { isQuotaError } from '../../common/utils/ai-error.helper';
import { getGeminiChatModel } from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  GenerateProductContentDto,
  ProductContentResponseDto,
} from './dto/product-content.dto';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// Buộc Gemini trả JSON đúng cấu trúc {title, description, highlights[]}.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    highlights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.STRING },
        },
        required: ['label', 'value'],
      },
    },
  },
  required: ['title', 'description', 'highlights'],
};

@Injectable()
export class ProductContentService {
  private readonly logger = new Logger(ProductContentService.name);
  private readonly ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
  });
  private readonly model = getGeminiChatModel();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async generate(
    req: Request,
    dto: GenerateProductContentDto,
  ): Promise<ProductContentResponseDto> {
    const userId = getUserIdFromRequest(req, this.jwtService);
    // Chỉ seller đang hoạt động mới được dùng.
    await getActiveSellerIdForUser(this.prisma, userId);

    if (!dto?.imageUrl?.trim()) {
      throw new BadRequestException('Thiếu ảnh sản phẩm.');
    }

    const { mimeType, base64 } = this.readImage(dto.imageUrl);
    const context = await this.buildContext(dto);

    const prompt =
      `Bạn là trợ lý viết nội dung bán hàng cho sàn TMĐT Moon Store. ` +
      `Hãy nhìn ẢNH sản phẩm và viết nội dung bằng TIẾNG VIỆT:\n` +
      `- title: tên/tiêu đề sản phẩm hấp dẫn, ngắn gọn.\n` +
      `- description: đoạn mô tả bán hàng 2-4 câu, nêu lợi ích chính.\n` +
      `- highlights: 4-8 thông số/đặc điểm nổi bật dạng {label, value} (vd {"label":"Màu sắc","value":"Đen"}).\n` +
      `Chỉ dựa vào những gì nhìn thấy trong ảnh và thông tin gợi ý; KHÔNG bịa thông số không chắc chắn.` +
      (context ? `\n\nThông tin gợi ý:\n${context}` : '');

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.4,
        },
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: prompt },
            ],
          },
        ],
      });

      const parsed = JSON.parse(
        response.text ?? '{}',
      ) as ProductContentResponseDto;
      return {
        title: parsed.title ?? '',
        description: parsed.description ?? '',
        highlights: Array.isArray(parsed.highlights)
          ? parsed.highlights.filter((h) => h?.label && h?.value)
          : [],
      };
    } catch (error) {
      this.logger.error('Generate product content failed', error as Error);
      throw new BadRequestException(
        isQuotaError(error)
          ? 'AI đang quá tải hoặc đã hết lượt dùng miễn phí hôm nay, vui lòng thử lại sau.'
          : 'Không tạo được nội dung từ ảnh, vui lòng thử lại.',
      );
    }
  }

  private readImage(imageUrl: string): { mimeType: string; base64: string } {
    const filename = imageUrl.split('/').pop();
    if (!filename) {
      throw new BadRequestException('Đường dẫn ảnh không hợp lệ.');
    }
    const fullPath = join(UPLOAD_PRODUCTS_DIR, filename);
    if (!existsSync(fullPath)) {
      throw new BadRequestException('Không tìm thấy file ảnh trên máy chủ.');
    }
    const mimeType =
      MIME_BY_EXT[extname(filename).toLowerCase()] ?? 'image/jpeg';
    const base64 = readFileSync(fullPath).toString('base64');
    return { mimeType, base64 };
  }

  private async buildContext(dto: GenerateProductContentDto): Promise<string> {
    const lines: string[] = [];
    if (dto.name?.trim()) lines.push(`Tên gợi ý: ${dto.name.trim()}`);
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { name: true },
      });
      if (category) lines.push(`Danh mục: ${category.name}`);
    }
    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: dto.brandId },
        select: { name: true },
      });
      if (brand) lines.push(`Thương hiệu: ${brand.name}`);
    }
    return lines.join('\n');
  }
}
