import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogService {
  findAll() {
    return {
      module: 'catalog',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'catalog',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
