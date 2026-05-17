import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { createHmac, timingSafeEqual } from 'crypto';
import { AxiosError } from 'axios';
import type {
  BillingData,
  IntentionResponse,
  PaymobWebhookPayload,
} from 'src/utils/types';

interface PaymobIntentionResult {
  paymentUrl: string;
  paymobIntentionId: string;
}

@Injectable()
export class PaymobService {
  private readonly logger = new Logger(PaymobService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Creates a payment intention and returns the hosted checkout URL.
   */
  async createPaymentIntention(
    amount: number,
    orderId: number,
    billingData: BillingData,
  ): Promise<PaymobIntentionResult> {
    try {
      const secretKey = this.config.getOrThrow<string>('PAYMOB_SECRET_KEY');
      const publicKey = this.config.getOrThrow<string>('PAYMOB_PUBLIC_KEY');
      const integrationId = Number(
        this.config.getOrThrow<string>('PAYMOB_INTEGRATION_ID'),
      );

      const amountCents = Math.round(amount * 100);

      const payload = {
        amount: amountCents,
        currency: 'EGP',
        payment_methods: [integrationId],
        items: [], // Optional: Can be populated with order items if needed
        billing_data: {
          first_name: billingData.first_name,
          last_name: billingData.last_name,
          phone_number: billingData.phone_number,
          email: billingData.email,
          apartment: billingData.apartment || 'NA',
          floor: billingData.floor || 'NA',
          street: billingData.street || 'NA',
          building: billingData.building || 'NA',
          city: billingData.city || 'Cairo',
          country: billingData.country || 'EG',
        },
        special_reference: orderId.toString(),
        notification_url: this.config.get<string>('PAYMOB_WEBHOOK_URL'),
        redirection_url: `${this.config.get('FRONTEND_URL')}/payment-result`,
      };

      const { data } = await firstValueFrom(
        this.http.post<IntentionResponse>(
          'https://accept.paymob.com/v1/intention/',
          payload,
          {
            headers: {
              Authorization: `Token ${secretKey}`,
            },
          },
        ),
      );

      if (!data?.client_secret) {
        throw new BadRequestException('Paymob did not return client secret');
      }

      const paymentUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${data.client_secret}`;

      return {
        paymentUrl,
        paymobIntentionId: data.id,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(
          'Paymob Intention Error:',
          error.response?.data || error.message,
        );
        throw new BadRequestException(
          `Failed to create payment intention: ${
            (error.response?.data as { message?: string })?.message ||
            error.message
          }`,
        );
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Paymob Intention Error:', message);
      throw new BadRequestException(
        `Failed to create payment intention: ${message}`,
      );
    }
  }

  /**
   * Verifies the HMAC signature from Paymob webhook.
   */
  verifyHmac(payload: PaymobWebhookPayload, receivedHmac: string): boolean {
    const secret = this.config.getOrThrow<string>('PAYMOB_HMAC');

    if (!receivedHmac) return false;

    const { obj } = payload;

    // Standard Paymob Transaction HMAC concatenation order
    const concatenatedString = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      obj.order?.id,
      obj.pending,
      obj.source_data?.pan ?? '',
      obj.source_data?.sub_type ?? '',
      obj.source_data?.type ?? '',
      obj.success,
    ].join('');

    const generatedHmac = createHmac('sha512', secret)
      .update(concatenatedString)
      .digest('hex');

    return timingSafeEqual(
      Buffer.from(generatedHmac),
      Buffer.from(receivedHmac),
    );
  }
}
