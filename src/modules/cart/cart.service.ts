import { Injectable } from '@nestjs/common';

@Injectable()
export class CartService {
  findAll() {
    return {
      module: 'cart',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'cart',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
