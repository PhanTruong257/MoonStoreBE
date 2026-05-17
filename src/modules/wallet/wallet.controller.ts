import { Body, Controller, Get, Post } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { Request } from 'express';

import { WalletService } from './wallet.service';
import type { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@Req() req: Request) {
    return this.walletService.getWalletDetail(req);
  }

  @Post('withdrawals')
  createWithdrawal(@Req() req: Request, @Body() payload: CreateWithdrawalDto) {
    return this.walletService.createWithdrawal(req, payload);
  }
}
