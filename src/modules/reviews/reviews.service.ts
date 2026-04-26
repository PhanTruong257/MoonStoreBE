import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { extractUserIdFromRequest } from '../../common/auth/auth-token.helper';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateReviewDto } from './dto/create-review.dto';
import type {
  CreateReviewResponseDto,
  ProductReviewsResponseDto,
  ReviewEligibilityResponseDto,
  ReviewsModuleDetailResponseDto,
  ReviewsModuleListResponseDto,
} from './dto/reviews-response.dto';

const DELIVERED_STATUS = 'DELIVERED';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private getUserIdFromRequest(req: Request) {
    return extractUserIdFromRequest(req, this.jwtService);
  }

  private async hasDeliveredOrderItem(userId: number, productId: number) {
    const item = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        orderGroup: {
          status: DELIVERED_STATUS,
          order: { userId },
        },
      },
      select: { id: true },
    });
    return Boolean(item);
  }

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

  async listForProduct(productId: number): Promise<ProductReviewsResponseDto> {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      orderBy: { id: 'desc' },
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0 ? reviews.reduce((sum, item) => sum + item.rating, 0) / totalReviews : 0;

    return {
      productId,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        user: review.user,
      })),
    };
  }

  async getEligibility(req: Request, productId: number): Promise<ReviewEligibilityResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const existing = await this.prisma.review.findFirst({
      where: { userId, productId },
      select: { id: true },
    });

    if (existing) {
      return {
        productId,
        canReview: false,
        reason: 'Already reviewed',
        existingReviewId: existing.id,
      };
    }

    const hasDelivered = await this.hasDeliveredOrderItem(userId, productId);
    if (!hasDelivered) {
      return {
        productId,
        canReview: false,
        reason: 'No delivered purchase found',
        existingReviewId: null,
      };
    }

    return {
      productId,
      canReview: true,
      reason: null,
      existingReviewId: null,
    };
  }

  async createReview(req: Request, payload: CreateReviewDto): Promise<CreateReviewResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    if (!payload.productId || !Number.isFinite(payload.rating)) {
      throw new BadRequestException('Invalid payload.');
    }
    if (payload.rating < 1 || payload.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5.');
    }

    const existing = await this.prisma.review.findFirst({
      where: { userId, productId: payload.productId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product.');
    }

    const hasDelivered = await this.hasDeliveredOrderItem(userId, payload.productId);
    if (!hasDelivered) {
      throw new ForbiddenException('You can only review products you have received.');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: payload.productId,
        rating: payload.rating,
        comment: payload.comment?.trim() ?? null,
      },
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });

    return {
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        user: review.user,
      },
    };
  }
}
