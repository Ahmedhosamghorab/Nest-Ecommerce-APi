import { Test, TestingModule } from '@nestjs/testing';
import { PaymobService } from './paymob.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { of } from 'rxjs';
import { BadRequestException } from '@nestjs/common';

describe('PaymobService', () => {
  let service: PaymobService;
  let httpService: HttpService;
  let configService: ConfigService;
  let ordersService: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymobService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
            getOrThrow: jest.fn().mockReturnValue('mocked_value'),
          },
        },
        {
          provide: OrdersService,
          useValue: {
            handleSuccessfulPayment: jest.fn(),
            handleFailedPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymobService>(PaymobService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentIntention', () => {
    it('should return payment details on success', async () => {
      const response = {
        data: {
          client_secret: 'secret',
          id: 'paymob_id',
        },
      };
      (httpService.post as jest.Mock).mockReturnValue(of(response));

      const result = await service.createPaymentIntention(100, 1, {});
      expect(result).toHaveProperty('paymentUrl');
      expect(result).toHaveProperty('paymobIntentionId', 'paymob_id');
    });

    it('should throw BadRequestException if response is invalid', async () => {
      (httpService.post as jest.Mock).mockReturnValue(of({ data: {} }));
      await expect(service.createPaymentIntention(100, 1, {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyHmac', () => {
    it('should return false if payload is missing', () => {
      expect(service.verifyHmac(null, 'hmac')).toBe(false);
    });
  });
});
