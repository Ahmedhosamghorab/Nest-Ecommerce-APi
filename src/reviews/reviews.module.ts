import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { ReviewService } from './reviews.service';
@Module({
  controllers: [ReviewsController],
  imports: [TypeOrmModule.forFeature([Review])],
  providers: [ReviewService],
})
export class ReviewsModule {}
