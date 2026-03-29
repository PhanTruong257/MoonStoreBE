import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  findAll() {
    return {
      module: 'payments',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'payments',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
