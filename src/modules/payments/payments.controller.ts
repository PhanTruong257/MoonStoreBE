import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type {
  PaymentsModuleDetailResponseDto,
  PaymentsModuleListResponseDto,
} from './dto/payments-response.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(): PaymentsModuleListResponseDto {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): PaymentsModuleDetailResponseDto {
    return this.paymentsService.findOne(id);
  }
}
