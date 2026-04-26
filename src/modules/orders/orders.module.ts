import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { VouchersModule } from '../vouchers/vouchers.module';

@Module({
  imports: [JwtModule.register({}), VouchersModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
