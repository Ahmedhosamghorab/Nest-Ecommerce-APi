import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './products/product.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Review } from './reviews/review.entity';
import { User } from './users/user.entity';
import { UploadsModule } from './uploads/uploads.module';
import { MailModule } from './mail/mail.module';
import { ProductImage } from './products/product_image.entity';
import { CartsModule } from './carts/carts.module';
import { Cart } from './carts/entities/cart.entity';
import { CartItem } from './carts/entities/cart-item.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrdersModule } from './orders/orders.module';
import { PaymobModule } from './paymob/paymob.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';

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
          entities: [
            Product,
            Review,
            User,
            ProductImage,
            Cart,
            CartItem,
            Order,
            OrderItem,
          ],
        };
      },
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.development' }),
    ProductsModule,
    ReviewsModule,
    UsersModule,
    UploadsModule,
    MailModule,
    CartsModule,
    OrdersModule,
    PaymobModule,
    EventEmitterModule.forRoot(),
  ],
  exports: [],
  providers: [],
  controllers: [],
})
export class AppModule {}
