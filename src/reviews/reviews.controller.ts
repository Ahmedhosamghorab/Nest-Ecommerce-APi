import {
  Get,
  Controller,
  Body,
  Post,
  Param,
  ParseIntPipe,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './reviews.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import type { JWTPayload } from 'src/utils/types';
import { AuthGuard } from 'src/users/guards/auth.guard';
@Controller('api/reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewService) {}
  // Post: ~/api/reviews
  @Post(':productId')
  @UseGuards(AuthGuard)
  public createNewReview(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() payload: JWTPayload,
    @Body() dto: CreateReviewDto,
  ) {
    const userId = payload.id;
    return this.reviewService.createNewReview(productId, userId, dto);
  }
  // Get: ~/api/reviews
  @Get()
  public getAllReviews() {
    return this.reviewService.getAll();
  }
  // Put: ~/api/reviews
  @Put(':id')
  public updateReview(
    @Param('id', ParseIntPipe) id: number,
    dto: UpdateReviewDto,
  ) {
    return this.reviewService.update(id, dto);
  }
  // Put: ~/api/reviews
  @Get(':id')
  public getSingleReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.getOneBy(id);
  }
  // Delete: ~/api/reviews
  @Delete(':id')
  public deleteReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.delete(id);
  }
}
