import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { AdminVouchersService } from './admin-vouchers.service';
import type {
  AdminVoucherListResponseDto,
  AdminVoucherResponseDto,
  AdminVoucherUsageListResponseDto,
  CreateVoucherDto,
  UpdateVoucherDto,
} from './dto/voucher.dto';

@Controller('admin/vouchers')
export class AdminVouchersController {
  constructor(private readonly service: AdminVouchersService) {}

  @Get()
  list(@Req() req: Request): Promise<AdminVoucherListResponseDto> {
    return this.service.list(req);
  }

  @Post()
  create(@Req() req: Request, @Body() payload: CreateVoucherDto): Promise<AdminVoucherResponseDto> {
    return this.service.create(req, payload);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateVoucherDto
  ): Promise<AdminVoucherResponseDto> {
    return this.service.update(req, id, payload);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number): Promise<{ id: number }> {
    return this.service.delete(req, id);
  }

  @Get(':id/usages')
  usages(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number
  ): Promise<AdminVoucherUsageListResponseDto> {
    return this.service.listUsages(req, id);
  }
}
