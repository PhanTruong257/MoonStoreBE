import { Injectable } from '@nestjs/common';
import type {
  OrdersModuleDetailResponseDto,
  OrdersModuleListResponseDto,
} from './dto/orders-response.dto';

@Injectable()
export class OrdersService {
  findAll(): OrdersModuleListResponseDto {
    return {
      module: 'orders',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): OrdersModuleDetailResponseDto {
    return {
      module: 'orders',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
