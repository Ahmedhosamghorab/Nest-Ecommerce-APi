import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Param,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { CheckoutResponse } from 'src/utils/types';
import type { JWTPayload } from 'src/utils/types';
import { CheckoutDto } from './dtos/checkout.dto';
import { Order } from './entities/order.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Checkout and create an order' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order created and payment URL generated.',
    type: CheckoutResponse,
  })
  @ApiBody({ type: CheckoutDto })
  @Post('checkout')
  checkout(
    @CurrentUser() payload: JWTPayload,
    @Body() checkoutDto: CheckoutDto,
  ): Promise<CheckoutResponse> {
    return this.ordersService.checkout(payload.id, checkoutDto);
  }

  @ApiOperation({ summary: "Get current user's orders" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orders retrieved successfully.',
    type: [Order],
  })
  @Get()
  getOrders(@CurrentUser() payload: JWTPayload): Promise<Order[]> {
    return this.ordersService.getAll(payload.id);
  }

  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order details retrieved successfully.',
    type: Order,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Order not found.' })
  @Get(':id')
  getOrderDetails(
    @CurrentUser() payload: JWTPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Order> {
    return this.ordersService.getOneBy(payload.id, id);
  }
}
