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
  Query,
} from '@nestjs/common';
import { ReviewService } from './reviews.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import type { JWTPayload } from 'src/utils/types';
import { AuthGuard } from 'src/users/guards/auth.guard';
import { AuthRolesGuard } from 'src/users/guards/auth-roles.guard';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { UserType } from 'src/utils/enums';
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
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public getAllReviews(
    @Query('pageNumber', ParseIntPipe) pageNumber: number,
    @Query('reviewPerPage', ParseIntPipe) reviewPerPage: number,
  ) {
    return this.reviewService.getAll(pageNumber, reviewPerPage);
  }
  // Put: ~/api/reviews
  @Put(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  public updateReview(
    @CurrentUser() user: JWTPayload,
    @Param('id', ParseIntPipe) id: number,
    dto: UpdateReviewDto,
  ) {
    return this.reviewService.update(user.id, id, dto);
  }
  // Put: ~/api/reviews
  @Get(':id')
  public getSingleReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.getOneBy(id);
  }
  // Delete: ~/api/reviews
  @Delete(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  public deleteReview(
    @CurrentUser() payload: JWTPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reviewService.delete(payload, id);
  }
}
