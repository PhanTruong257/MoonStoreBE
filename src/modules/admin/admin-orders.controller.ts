import { Controller, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { AdminOrdersService } from './admin-orders.service';
import type {
  AdminOrderDetailResponseDto,
  AdminOrderListResponseDto,
} from './dto/admin-orders.dto';

@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}

  @Get()
  list(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('sellerId') sellerIdRaw?: string,
    @Query('userId') userIdRaw?: string
  ): Promise<AdminOrderListResponseDto> {
    const sellerId = sellerIdRaw ? Number(sellerIdRaw) : undefined;
    const userId = userIdRaw ? Number(userIdRaw) : undefined;
    return this.service.list(req, {
      status: status?.trim() || undefined,
      paymentStatus: paymentStatus?.trim() || undefined,
      sellerId: Number.isFinite(sellerId) ? sellerId : undefined,
      userId: Number.isFinite(userId) ? userId : undefined,
    });
  }

  @Get(':id')
  detail(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number
  ): Promise<AdminOrderDetailResponseDto> {
    return this.service.detail(req, id);
  }
}
