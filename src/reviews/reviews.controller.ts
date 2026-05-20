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
  HttpStatus,
} from '@nestjs/common';
import { ReviewService } from './reviews.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { MessageResponse } from 'src/utils/types';
import type { JWTPayload } from 'src/utils/types';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AuthRolesGuard } from 'src/auth/guards/auth-roles.guard';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { UserType } from 'src/utils/enums';
import { Review } from './review.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewService) {}

  @ApiOperation({ summary: 'Create a new review for a product' })
  @ApiBearerAuth()
  @ApiParam({ name: 'productId', type: 'number' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Review created successfully.',
    type: Review,
  })
  @ApiBody({ type: CreateReviewDto })
  @Post(':productId')
  @UseGuards(AuthGuard)
  public createNewReview(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() payload: JWTPayload,
    @Body() dto: CreateReviewDto,
  ): Promise<Review> {
    const userId = payload.id;
    return this.reviewService.createNewReview(productId, userId, dto);
  }

  @ApiOperation({ summary: 'Get all reviews (Admin only)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'pageNumber', type: 'number' })
  @ApiQuery({ name: 'reviewPerPage', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reviews retrieved successfully.',
    type: [Review],
  })
  @Get()
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public getAllReviews(
    @Query('pageNumber', ParseIntPipe) pageNumber: number,
    @Query('reviewPerPage', ParseIntPipe) reviewPerPage: number,
  ): Promise<Review[]> {
    return this.reviewService.getAll(pageNumber, reviewPerPage);
  }

  @ApiOperation({ summary: 'Update a review' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review updated successfully.',
    type: Review,
  })
  @ApiBody({ type: UpdateReviewDto })
  @Put(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  public updateReview(
    @CurrentUser() user: JWTPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
  ): Promise<Review> {
    return this.reviewService.update(user.id, id, dto);
  }

  @ApiOperation({ summary: 'Get a single review by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review retrieved successfully.',
    type: Review,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found.' })
  @Get(':id')
  public getSingleReview(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Review> {
    return this.reviewService.getOneBy(id);
  }

  @ApiOperation({ summary: 'Delete a review' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review deleted successfully.',
    type: MessageResponse,
  })
  @Delete(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  public deleteReview(
    @CurrentUser() payload: JWTPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MessageResponse> {
    return this.reviewService.delete(payload, id);
  }
}
