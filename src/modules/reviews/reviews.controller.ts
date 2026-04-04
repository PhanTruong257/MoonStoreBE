import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import type {
  ReviewsModuleDetailResponseDto,
  ReviewsModuleListResponseDto,
} from './dto/reviews-response.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findAll(): ReviewsModuleListResponseDto {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): ReviewsModuleDetailResponseDto {
    return this.reviewsService.findOne(id);
  }
}
