import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PaymobService } from './paymob.service';
import { OrdersService } from 'src/orders/orders.service';
import type { PaymobWebhookPayload } from 'src/utils/types';

@Controller('paymob')
export class PaymobController {
  private readonly logger = new Logger(PaymobController.name);

  constructor(
    private readonly paymobService: PaymobService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Paymob Webhook: Handles transaction status updates.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Body() payload: PaymobWebhookPayload,
    @Headers('hmac') hmac: string,
  ) {
    this.logger.log(
      `Received Paymob webhook for transaction ${payload.obj.id}`,
    );

    // 1. Verify HMAC
    const isValid = this.paymobService.verifyHmac(payload, hmac);
    if (!isValid) {
      this.logger.error(`Invalid HMAC for transaction ${payload.obj.id}`);
      throw new BadRequestException('Invalid HMAC');
    }

    // 2. Extract Order ID
    // We used special_reference in createPaymentIntention,
    // it usually comes back in obj.special_reference or obj.order.merchant_order_id
    const orderIdRaw =
      payload.obj.special_reference || payload.obj.order?.merchant_order_id;

    if (!orderIdRaw) {
      this.logger.warn(
        `No order reference found in payload for transaction ${payload.obj.id}`,
      );
      return { received: true }; // Still return 200 to Paymob
    }

    const orderId = Number(orderIdRaw);

    // 3. Handle Payment Status
    const { success, pending } = payload.obj;

    if (success === true && pending === false) {
      this.logger.log(`Payment successful for order ${orderId}`);
      await this.ordersService.handleSuccessfulPayment(orderId);
    } else if (success === false && pending === false) {
      this.logger.warn(
        `Payment failed for order ${orderId}: ${payload.obj.data?.message}`,
      );
      await this.ordersService.handleFailedPayment(orderId);
    } else {
      this.logger.log(`Payment pending for order ${orderId}`);
    }

    return {
      received: true,
    };
  }
}
