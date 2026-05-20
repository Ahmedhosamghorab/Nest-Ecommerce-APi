import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from 'src/products/products.module';
import { ReviewService } from './reviews.service';
import { AuthModule } from 'src/auth/auth.module';
@Module({
  controllers: [ReviewsController],
  imports: [
    TypeOrmModule.forFeature([Review]),
    AuthModule,
    UsersModule,
    ProductsModule,
  ],
  providers: [ReviewService],
})
export class ReviewsModule {}
