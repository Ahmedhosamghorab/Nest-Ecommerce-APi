import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartsModule } from 'src/carts/carts.module';
import { AuthModule } from 'src/auth/auth.module';
import { PaymobModule } from 'src/paymob/paymob.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    CartsModule,
    AuthModule,
    forwardRef(() => PaymobModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
