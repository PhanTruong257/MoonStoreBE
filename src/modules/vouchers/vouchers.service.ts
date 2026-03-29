import { Injectable } from '@nestjs/common';

@Injectable()
export class VouchersService {
  findAll() {
    return {
      module: 'vouchers',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'vouchers',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
