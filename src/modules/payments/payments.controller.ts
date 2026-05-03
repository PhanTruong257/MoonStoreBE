import { Controller, Get, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import type {
  ConfirmManualResponseDto,
  QrPaymentInfoDto,
  VnpayIpnResponseDto,
  VnpayReturnResponseDto,
} from './dto/payments-response.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('vnpay/return')
  vnpayReturn(@Query() query: Record<string, string>): Promise<VnpayReturnResponseDto> {
    return this.paymentsService.handleVnpayReturn(query);
  }

  @Get('vnpay/ipn')
  vnpayIpn(@Query() query: Record<string, string>): Promise<VnpayIpnResponseDto> {
    return this.paymentsService.handleVnpayIpn(query);
  }

  @Get('order/:orderId/qr')
  getOrderQrInfo(
    @Req() req: Request,
    @Param('orderId', ParseIntPipe) orderId: number
  ): Promise<QrPaymentInfoDto> {
    return this.paymentsService.getOrderQrInfo(req, orderId);
  }

  @Post(':paymentId/confirm-manual')
  confirmManual(
    @Req() req: Request,
    @Param('paymentId', ParseIntPipe) paymentId: number
  ): Promise<ConfirmManualResponseDto> {
    return this.paymentsService.confirmPaymentManual(req, paymentId);
  }
}
