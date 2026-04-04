import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SellersService } from './sellers.service';
import type {
  SellersModuleDetailResponseDto,
  SellersModuleListResponseDto,
} from './dto/sellers-response.dto';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get()
  findAll(): SellersModuleListResponseDto {
    return this.sellersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): SellersModuleDetailResponseDto {
    return this.sellersService.findOne(id);
  }
}
