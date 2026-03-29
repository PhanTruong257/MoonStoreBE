import { Injectable } from '@nestjs/common';

@Injectable()
export class ShipmentsService {
  findAll() {
    return {
      module: 'shipments',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'shipments',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
