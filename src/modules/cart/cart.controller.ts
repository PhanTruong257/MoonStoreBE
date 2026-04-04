import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import type { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  findAll() {
    return this.cartService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cartService.findOne(id);
  }

  @Post('items')
  addItem(@Body() payload: AddToCartDto) {
    return this.cartService.addItem(payload);
  }
}
