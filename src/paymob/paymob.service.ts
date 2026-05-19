import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class PaymobService {
  // private readonly logger = new Logger(PaymobService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  // =========================
  // CREATE INTENTION
  // =========================
  async createPaymentIntention(
    amount: number,
    orderId: number,
    billingData: any,
  ) {
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
      items: [],
      billing_data: {
        ...billingData,
        country: billingData.country || 'EG',
      },
      special_reference: orderId.toString(),
      notification_url: this.config.get<string>('PAYMOB_WEBHOOK_URL'),
      redirection_url: `${this.config.get<string>('FRONTEND_URL')}/payment-result`,
    };

    const { data } = await firstValueFrom(
      this.http.post('https://accept.paymob.com/v1/intention/', payload, {
        headers: { Authorization: `Token ${secretKey}` },
      }),
    );

    if (!data?.client_secret) {
      throw new BadRequestException('Invalid Paymob response');
    }

    return {
      paymentUrl: `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${data.client_secret}`,
      paymobIntentionId: data.id,
    };
  }

  // =========================
  // MAIN VERIFY ENTRY
  // =========================
  verifyHmac(payload: any, receivedHmac: string): boolean {
    const obj = payload?.obj;
    if (!obj || !receivedHmac) return false;

    const secret = this.config.getOrThrow<string>('PAYMOB_HMAC').trim();

    // 🔥 Detect type correctly (Paymob reality)
    const isCardToken = !!obj.masked_pan && !!obj.token;

    const fields = isCardToken
      ? this.getCardTokenFields(obj)
      : this.getTransactionFields(obj);

    const concatenated = fields.map((v) => this.normalize(v)).join('');

    const generated = createHmac('sha512', secret)
      .update(concatenated, 'utf8')
      .digest('hex');

    // this.logger.debug('==== PAYMOB HMAC DEBUG ====');
    // this.logger.debug(`CONCAT: ${concatenated}`);
    // this.logger.debug(`GENERATED: ${generated}`);
    // this.logger.debug(`RECEIVED: ${receivedHmac}`);

    const genBuf = Buffer.from(generated, 'hex');
    const recBuf = Buffer.from(receivedHmac, 'hex');

    if (genBuf.length !== recBuf.length) return false;

    return timingSafeEqual(genBuf, recBuf);
  }

  // =========================
  // TRANSACTION CALLBACK (EXACT ORDER FROM DOCS)
  // =========================
  private getTransactionFields(obj: any) {
    return [
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
      obj.owner,
      obj.pending,
      obj.source_data?.pan,
      obj.source_data?.sub_type,
      obj.source_data?.type,
      obj.success,
    ];
  }

  // =========================
  // CARD TOKEN CALLBACK (EXACT ORDER FROM DOCS)
  // =========================
  private getCardTokenFields(obj: any) {
    return [
      obj.card_subtype,
      obj.created_at,
      obj.email,
      obj.id,
      obj.masked_pan,
      obj.merchant_id,
      obj.order_id,
      obj.token,
    ];
  }

  // =========================
  // NORMALIZER (STRICT)
  // =========================
  private normalize(v: any): string {
    if (v === null || v === undefined) return '';

    if (typeof v === 'boolean') return v ? 'true' : 'false';

    if (typeof v === 'number') return String(v); // ❗ NO truncation (Paymob depends on exact value)

    if (typeof v === 'object') return '';

    return String(v).trim();
  }
}
