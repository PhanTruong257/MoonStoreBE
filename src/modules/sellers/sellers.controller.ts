import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { SellersService } from './sellers.service';
import type {
  CreateProductResponseDto,
  CreateSellerResponseDto,
  SellersModuleDetailResponseDto,
  SellersModuleListResponseDto,
} from './dto/sellers-response.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { CreateSellerDto } from './dto/create-seller.dto';
import type { UpdateSellerProductDto } from './dto/update-product.dto';
import type {
  SellerOrderDetailResponseDto,
  SellerOrderListResponseDto,
  SellerProductListResponseDto,
  SellerStatsResponseDto,
} from './dto/seller-orders-response.dto';

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

  @Get('products/:productId/detail')
  getProductDetail(
    @Req() req: Request,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<CreateProductResponseDto> {
    return this.sellersService.getSellerProductDetail(req, productId);
  }

  @Patch('products/:productId')
  updateProduct(
    @Req() req: Request,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() payload: UpdateSellerProductDto,
  ): Promise<CreateProductResponseDto> {
    return this.sellersService.updateSellerProduct(req, productId, payload);
  }

  @Delete('products/:productId')
  deleteProduct(
    @Req() req: Request,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<{ id: number; status: string }> {
    return this.sellersService.deleteSellerProduct(req, productId);
  }

  @Get('me/products')
  findMyProducts(@Req() req: Request): Promise<SellerProductListResponseDto> {
    return this.sellersService.findSellerProducts(req);
  }

  @Get('me/orders')
  findMyOrders(@Req() req: Request): Promise<SellerOrderListResponseDto> {
    return this.sellersService.findSellerOrders(req);
  }

  @Get('me/orders/:groupId')
  findMyOrderDetail(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<SellerOrderDetailResponseDto> {
    return this.sellersService.getSellerOrderDetail(req, groupId);
  }

  @Get('me/stats')
  findMyStats(@Req() req: Request): Promise<SellerStatsResponseDto> {
    return this.sellersService.getSellerStats(req);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): SellersModuleDetailResponseDto {
    return this.sellersService.findOne(id);
  }
}
