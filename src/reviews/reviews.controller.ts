import {
  Get,
  Controller,
  Body,
  Post,
  Param,
  ParseIntPipe,
  Put,
  Delete,
} from '@nestjs/common';
import { ReviewService } from './reviews.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
@Controller('api/reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewService) {}
  // Post: ~/api/reviews
  @Post()
  public createNewReview(@Body() dto: CreateReviewDto) {
    return this.reviewService.createNewReview(dto);
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
