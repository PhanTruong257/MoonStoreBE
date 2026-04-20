import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { SellersService } from './sellers.service';
import type {
  CreateProductResponseDto,
  CreateSellerResponseDto,
  SellersModuleDetailResponseDto,
  SellersModuleListResponseDto,
} from './dto/sellers-response.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { CreateSellerDto } from './dto/create-seller.dto';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get()
  findAll(): SellersModuleListResponseDto {
    return this.sellersService.findAll();
  }

  @Post('register')
  createSeller(
    @Body() payload: CreateSellerDto,
  ): Promise<CreateSellerResponseDto> {
    return this.sellersService.createSellerProfile(payload);
  }

  @Post('products')
  createProduct(
    @Body() payload: CreateProductDto,
  ): Promise<CreateProductResponseDto> {
    return this.sellersService.createProduct(payload);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): SellersModuleDetailResponseDto {
    return this.sellersService.findOne(id);
  }
}
