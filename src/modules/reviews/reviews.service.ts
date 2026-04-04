import { Injectable } from '@nestjs/common';
import type {
  ReviewsModuleDetailResponseDto,
  ReviewsModuleListResponseDto,
} from './dto/reviews-response.dto';

@Injectable()
export class ReviewsService {
  findAll(): ReviewsModuleListResponseDto {
    return {
      module: 'reviews',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): ReviewsModuleDetailResponseDto {
    return {
      module: 'reviews',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
