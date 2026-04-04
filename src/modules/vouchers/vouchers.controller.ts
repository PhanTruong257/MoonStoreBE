import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import type {
  VouchersModuleDetailResponseDto,
  VouchersModuleListResponseDto,
} from './dto/vouchers-response.dto';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  findAll(): VouchersModuleListResponseDto {
    return this.vouchersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): VouchersModuleDetailResponseDto {
    return this.vouchersService.findOne(id);
  }
}
