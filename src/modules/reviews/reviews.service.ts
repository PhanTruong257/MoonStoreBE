import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewsService {
  findAll() {
    return {
      module: 'reviews',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'reviews',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
