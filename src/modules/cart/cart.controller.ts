import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import type {
  CartAddItemResponseDto,
  CartModuleDetailResponseDto,
  CartModuleListResponseDto,
  CartRemoveItemResponseDto,
  CartResponseDto,
  CartUpdateItemResponseDto,
} from './dto/cart-response.dto';
import type { AddToCartDto } from './dto/add-to-cart.dto';
import type { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  findAll(): CartModuleListResponseDto {
    return this.cartService.findAll();
  }

  @Get('user/:userId')
  getByUser(@Param('userId', ParseIntPipe) userId: number): Promise<CartResponseDto> {
    return this.cartService.getCartByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): CartModuleDetailResponseDto {
    return this.cartService.findOne(id);
  }

  @Post('items')
  addItem(@Body() payload: AddToCartDto): Promise<CartAddItemResponseDto> {
    return this.cartService.addItem(payload);
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() payload: UpdateCartItemDto
  ): Promise<CartUpdateItemResponseDto> {
    return this.cartService.updateItemQuantity(itemId, payload.quantity);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId', ParseIntPipe) itemId: number): Promise<CartRemoveItemResponseDto> {
    return this.cartService.removeItem(itemId);
  }
}
