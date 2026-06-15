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
import { CartService } from './cart.service';
import type {
  CartAddItemResponseDto,
  CartRemoveItemResponseDto,
  CartResponseDto,
  CartUpdateItemResponseDto,
} from './dto/cart-response.dto';
import type { AddToCartDto } from './dto/add-to-cart.dto';
import type { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('me')
  getMyCart(@Req() req: Request): Promise<CartResponseDto> {
    return this.cartService.getMyCart(req);
  }

  @Post('items')
  addItem(@Req() req: Request, @Body() payload: AddToCartDto): Promise<CartAddItemResponseDto> {
    return this.cartService.addItem(req, payload);
  }

  @Patch('items/:itemId')
  updateItem(
    @Req() req: Request,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() payload: UpdateCartItemDto
  ): Promise<CartUpdateItemResponseDto> {
    return this.cartService.updateItemQuantity(req, itemId, payload.quantity);
  }

  @Delete('items/:itemId')
  removeItem(
    @Req() req: Request,
    @Param('itemId', ParseIntPipe) itemId: number
  ): Promise<CartRemoveItemResponseDto> {
    return this.cartService.removeItem(req, itemId);
  }
}
