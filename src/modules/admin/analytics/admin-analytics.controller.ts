import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { AdminAnalyticsService } from './admin-analytics.service';
import type {
  AdminAnalyticsAskDto,
  AdminAnalyticsAskResponseDto,
} from '../dto/analytics.dto';

@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  // Dashboard số liệu thật (biểu đồ) — nạp 1 lần cho trang thống kê.
  @Get('dashboard')
  getDashboard(@Req() req: Request) {
    return this.analyticsService.getDashboard(req);
  }

  // NL2SQL: admin hỏi bằng tiếng Việt → AI gọi tool truy vấn → trả lời + data.
  @Post('ask')
  ask(
    @Req() req: Request,
    @Body() dto: AdminAnalyticsAskDto,
  ): Promise<AdminAnalyticsAskResponseDto> {
    return this.analyticsService.ask(req, dto.question ?? '', dto.history ?? []);
  }
}
