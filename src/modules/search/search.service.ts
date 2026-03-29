import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  findAll() {
    return {
      module: 'search',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'search',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
