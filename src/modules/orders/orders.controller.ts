import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import type {
  OrderCreateResponseDto,
  OrderDetailResponseDto,
  OrderGroupStatusResponseDto,
  OrderListResponseDto,
} from './dto/orders-response.dto';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { UpdateOrderGroupStatusDto } from './dto/update-order-group-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Req() req: Request,
    @Body() payload: CreateOrderDto,
  ): Promise<OrderCreateResponseDto> {
    return this.ordersService.createOrder(req, payload);
  }

  @Get()
  findAll(@Req() req: Request): Promise<OrderListResponseDto> {
    return this.ordersService.findOrders(req);
  }

  @Get(':id')
  findOne(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.getOrderDetail(req, id);
  }

  @Patch('groups/:groupId/status')
  updateGroupStatus(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() payload: UpdateOrderGroupStatusDto,
  ): Promise<OrderGroupStatusResponseDto> {
    return this.ordersService.updateGroupStatus(req, groupId, payload);
  }

  @Patch('groups/:groupId/cancel')
  cancelGroup(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<OrderGroupStatusResponseDto> {
    return this.ordersService.cancelGroup(req, groupId);
  }
}
