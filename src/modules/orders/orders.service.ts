import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdersService {
  findAll() {
    return {
      module: 'orders',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'orders',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
