import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ShipperController } from './shipper.controller';
import { ShipperService } from './shipper.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [JwtModule.register({}), WalletModule],
  controllers: [ShipperController],
  providers: [ShipperService],
})
export class ShipperModule {}
