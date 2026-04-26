import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [SellersController],
  providers: [SellersService],
})
export class SellersModule {}
