import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './products/product.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Review } from './reviews/review.entity';
import { User } from './users/user.entity';
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'mysql',
          database: config.get<string>('DB_NAME'),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          synchronize: true, // dev mode only   -   usage: run migrations automaticlly
          entities: [Product, Review, User],
        };
      },
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.development' }),
    ProductsModule,
    ReviewsModule,
    UsersModule,
  ],
  exports: [],
  providers: [],
  controllers: [],
})
export class AppModule {}
