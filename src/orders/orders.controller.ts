import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from 'src/users/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import type { JWTPayload, CheckoutResponse } from 'src/utils/types';
import { CheckoutDto } from './dtos/checkout.dto';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(
    @CurrentUser() payload: JWTPayload,
    @Body() checkoutDto: CheckoutDto,
  ): Promise<CheckoutResponse> {
    return this.ordersService.checkout(payload.id, checkoutDto);
  }

  // @Get()
  // getOrders(@CurrentUser() payload: JWTPayload): Promise<Order[]> {
  //   return this.ordersService.getOrders(payload.id);
  // }

  // @Get(':id')
  // getOrderDetails(
  //   @CurrentUser() payload: JWTPayload,
  //   @Param('id', ParseIntPipe) id: number,
  // ): Promise<Order> {
  //   return this.ordersService.getOrderDetails(payload.id, id);
  // }
}
