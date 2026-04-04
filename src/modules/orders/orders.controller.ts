import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import type {
  OrdersModuleDetailResponseDto,
  OrdersModuleListResponseDto,
} from './dto/orders-response.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(): OrdersModuleListResponseDto {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): OrdersModuleDetailResponseDto {
    return this.ordersService.findOne(id);
  }
}
