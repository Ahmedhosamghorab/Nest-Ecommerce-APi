import { forwardRef, Module } from '@nestjs/common';
import { PaymobService } from './paymob.service';
import { PaymobController } from './paymob.controller';
import { HttpModule } from '@nestjs/axios';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [HttpModule, forwardRef(() => OrdersModule)],
  controllers: [PaymobController],
  providers: [PaymobService],
  exports: [PaymobService],
})
export class PaymobModule {}
