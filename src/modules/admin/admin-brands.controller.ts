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

import { AdminBrandsService } from './admin-brands.service';
import type {
  AdminBrandListResponseDto,
  AdminBrandResponseDto,
  CreateBrandDto,
  UpdateBrandDto,
} from './dto/brand.dto';

@Controller('admin/brands')
export class AdminBrandsController {
  constructor(private readonly service: AdminBrandsService) {}

  @Get()
  list(@Req() req: Request): Promise<AdminBrandListResponseDto> {
    return this.service.list(req);
  }

  @Post()
  create(@Req() req: Request, @Body() payload: CreateBrandDto): Promise<AdminBrandResponseDto> {
    return this.service.create(req, payload);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateBrandDto
  ): Promise<AdminBrandResponseDto> {
    return this.service.update(req, id, payload);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number): Promise<{ id: number }> {
    return this.service.delete(req, id);
  }
}
