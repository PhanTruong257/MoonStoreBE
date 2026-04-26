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

import { AdminCategoriesService } from './admin-categories.service';
import type {
  AdminCategoryListResponseDto,
  AdminCategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly service: AdminCategoriesService) {}

  @Get()
  list(@Req() req: Request): Promise<AdminCategoryListResponseDto> {
    return this.service.list(req);
  }

  @Post()
  create(
    @Req() req: Request,
    @Body() payload: CreateCategoryDto
  ): Promise<AdminCategoryResponseDto> {
    return this.service.create(req, payload);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateCategoryDto
  ): Promise<AdminCategoryResponseDto> {
    return this.service.update(req, id, payload);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number): Promise<{ id: number }> {
    return this.service.delete(req, id);
  }
}
