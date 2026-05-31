import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { assertAdminFromRequest } from '../../common/auth/request-user.helper';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AiChatService } from './ai-chat.service';
import { AiChatRequestDto } from './dto/ai-chat.dto';

@Controller('ai')
export class AiChatController {
  constructor(
    private readonly aiChatService: AiChatService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('chat')
  async chat(@Body() dto: AiChatRequestDto, @Res() res: Response): Promise<void> {
    await this.aiChatService.streamChat(dto.message ?? '', dto.history ?? [], res);
  }

  @Post('admin/index-products')
  async indexProducts(@Req() req: Request): Promise<{ indexed: number; products: number }> {
    await assertAdminFromRequest(req, this.jwtService, this.prisma);
    return this.aiChatService.indexProducts();
  }
}
