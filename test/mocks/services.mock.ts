import { MailService } from '../../src/mail/mail.service';
import { PaymobService } from '../../src/paymob/paymob.service';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailerService } from '@nestjs-modules/mailer';
import { of } from 'rxjs';

export const createMockMailService = (): jest.Mocked<Partial<MailService>> => ({
  sendVerifyEmail: jest.fn().mockResolvedValue(undefined),
});

export const createMockMailerService = (): jest.Mocked<
  Partial<MailerService>
> => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
});

export const createMockPaymobService = (): jest.Mocked<
  Partial<PaymobService>
> => ({
  createPaymentIntention: jest.fn().mockResolvedValue({
    paymentUrl: 'https://accept.paymob.com/payment/123',
    intentionId: 'intention_123',
  }),
  verifyWebhookSignature: jest.fn().mockReturnValue(true),
  handleWebhook: jest.fn().mockResolvedValue(undefined),
});

export const createMockHttpService = (): jest.Mocked<Partial<HttpService>> => ({
  post: jest.fn().mockReturnValue(
    of({
      data: {
        id: 'intention_123',
        payment_url: 'https://accept.paymob.com/payment/123',
      },
    }),
  ),
  get: jest.fn().mockReturnValue(of({ data: {} })),
  put: jest.fn().mockReturnValue(of({ data: {} })),
  delete: jest.fn().mockReturnValue(of({ data: {} })),
});

export const createMockEventEmitter = (): jest.Mocked<
  Partial<EventEmitter2>
> => ({
  emit: jest.fn().mockReturnValue(true),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
});

export const createMockMulterFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'test-image.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 1024,
  destination: './uploads',
  filename: 'test-image-123.jpg',
  path: './uploads/test-image-123.jpg',
  buffer: Buffer.from('fake-image-data'),
  stream: null as any,
  ...overrides,
});
