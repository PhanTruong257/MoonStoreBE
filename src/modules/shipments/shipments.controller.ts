import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import type {
  ShipmentsModuleDetailResponseDto,
  ShipmentsModuleListResponseDto,
} from './dto/shipments-response.dto';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  findAll(): ShipmentsModuleListResponseDto {
    return this.shipmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): ShipmentsModuleDetailResponseDto {
    return this.shipmentsService.findOne(id);
  }
}
