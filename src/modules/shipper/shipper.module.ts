import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ShipperController } from './shipper.controller';
import { ShipperService } from './shipper.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ShipperController],
  providers: [ShipperService],
})
export class ShipperModule {}
