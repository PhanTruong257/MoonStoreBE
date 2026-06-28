import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import {
  assertAdminFromRequest,
  getUserIdFromRequest,
} from '../../common/auth/request-user.helper';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AiChatService } from './ai-chat.service';
import { ProductContentService } from './product-content.service';
import { AiChatRequestDto } from './dto/ai-chat.dto';
import type { GenerateProductContentDto } from './dto/product-content.dto';

@Controller('ai')
export class AiChatController {
  constructor(
    private readonly aiChatService: AiChatService,
    private readonly productContentService: ProductContentService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // Giới hạn 15 lượt/phút cho mỗi client để tránh lạm dụng và bảo vệ chi phí gọi Gemini API
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 15 } })
  @Post('chat')
  async chat(
    @Body() dto: AiChatRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.aiChatService.streamChat(
      dto.message ?? '',
      dto.history ?? [],
      res,
    );
  }

  // Trợ lý đặt hàng agentic (có tool-calling). Hoạt động cả khi chưa đăng nhập
  // (chỉ tư vấn), nhưng muốn đặt hàng thì cần đăng nhập.
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 15 } })
  @Post('agent')
  async agent(
    @Req() req: Request,
    @Body() dto: AiChatRequestDto,
  ): Promise<{ text: string; orderDraft?: unknown; products?: unknown }> {
    let userId: number | null = null;
    try {
      userId = getUserIdFromRequest(req, this.jwtService);
    } catch {
      userId = null;
    }
    return this.aiChatService.agentChat(
      userId,
      dto.message ?? '',
      dto.history ?? [],
    );
  }

  // Seller: sinh tiêu đề + mô tả + highlights từ ảnh sản phẩm (Gemini multimodal).
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('product-content')
  generateProductContent(
    @Req() req: Request,
    @Body() dto: GenerateProductContentDto,
  ) {
    return this.productContentService.generate(req, dto);
  }

  @Post('admin/index-products')
  async indexProducts(
    @Req() req: Request,
  ): Promise<{ indexed: number; products: number }> {
    await assertAdminFromRequest(req, this.jwtService, this.prisma);
    return this.aiChatService.indexProducts();
  }
}
