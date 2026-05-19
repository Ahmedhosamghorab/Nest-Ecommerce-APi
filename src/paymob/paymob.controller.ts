import {
  Controller,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';

import { PaymobService } from './paymob.service';
import { OrdersService } from 'src/orders/orders.service';

@Controller('paymob')
export class PaymobController {
  private readonly logger = new Logger(PaymobController.name);

  constructor(
    private readonly paymobService: PaymobService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() payload: any, @Query('hmac') hmac: string) {
    const obj = payload?.obj;

    this.logger.debug(`Webhook received: ${obj?.id}`);

    // =========================
    // HMAC CHECK
    // =========================
    const isValid = this.paymobService.verifyHmac(payload, hmac);

    if (!isValid) {
      this.logger.error(`Invalid HMAC for txn ${obj?.id}`);
      throw new BadRequestException('Invalid HMAC');
    }

    // =========================
    // ORDER ID extraction (FIXED priority)
    // =========================
    const orderId =
      obj?.special_reference ||
      obj?.order?.merchant_order_id ||
      obj?.payment_key_claims?.extra?.merchant_order_id ||
      obj?.data?.merchant_txn_ref;

    if (!orderId) {
      this.logger.warn(`No order reference for txn ${obj?.id}`);
      return { received: true };
    }

    const id = Number(orderId);

    // =========================
    // STATUS HANDLING
    // =========================
    if (obj.success === true && obj.pending === false) {
      await this.ordersService.handleSuccessfulPayment(id);
      this.logger.log(`Payment SUCCESS order ${id}`);
    } else if (obj.success === false && obj.pending === false) {
      await this.ordersService.handleFailedPayment(id);
      this.logger.warn(`Payment FAILED order ${id}`);
    } else {
      this.logger.log(`Payment PENDING order ${id}`);
    }

    return { received: true };
  }
}
