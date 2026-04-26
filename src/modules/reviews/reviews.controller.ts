import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReviewsService } from './reviews.service';
import type { CreateReviewDto } from './dto/create-review.dto';
import type {
  CreateReviewResponseDto,
  ProductReviewsResponseDto,
  ReviewEligibilityResponseDto,
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

  @Get('product/:productId')
  listForProduct(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<ProductReviewsResponseDto> {
    return this.reviewsService.listForProduct(productId);
  }

  @Get('eligibility/:productId')
  getEligibility(
    @Req() req: Request,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<ReviewEligibilityResponseDto> {
    return this.reviewsService.getEligibility(req, productId);
  }

  @Post()
  createReview(
    @Req() req: Request,
    @Body() payload: CreateReviewDto,
  ): Promise<CreateReviewResponseDto> {
    return this.reviewsService.createReview(req, payload);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): ReviewsModuleDetailResponseDto {
    return this.reviewsService.findOne(id);
  }
}
