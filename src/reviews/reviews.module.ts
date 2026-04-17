import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from 'src/products/products.module';
import { ReviewService } from './reviews.service';
@Module({
  controllers: [ReviewsController],
  imports: [
    TypeOrmModule.forFeature([Review]),
    JwtModule,
    UsersModule,
    ProductsModule,
  ],
  providers: [ReviewService],
})
export class ReviewsModule {}
