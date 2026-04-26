import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import type { ValidateVoucherDto } from './dto/validate-voucher.dto';
import type {
  VoucherValidateResponseDto,
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

  @Post('validate')
  validate(
    @Body() payload: ValidateVoucherDto,
  ): Promise<VoucherValidateResponseDto> {
    return this.vouchersService.validateVoucher(payload);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): VouchersModuleDetailResponseDto {
    return this.vouchersService.findOne(id);
  }
}
