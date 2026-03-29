import { Injectable } from '@nestjs/common';

@Injectable()
export class SellersService {
  findAll() {
    return {
      module: 'sellers',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'sellers',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
