import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaymentsModule } from '../payments/payments.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [JwtModule.register({}), VouchersModule, PaymentsModule, WalletModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
