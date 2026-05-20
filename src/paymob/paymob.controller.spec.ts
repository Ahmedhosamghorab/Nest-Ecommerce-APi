import { Test, TestingModule } from '@nestjs/testing';
import { PaymobController } from './paymob.controller';
import { PaymobService } from './paymob.service';

describe('PaymobController', () => {
  let controller: PaymobController;
  let service: PaymobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymobController],
      providers: [
        {
          provide: PaymobService,
          useValue: {
            hook: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymobController>(PaymobController);
    service = module.get<PaymobService>(PaymobService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('webhook', () => {
    it('should handle webhook payload', async () => {
      const payload = {
        type: 'TRANSACTION',
        obj: {
          id: 'transaction_123',
          success: true,
        },
      };
      const hmac = 'valid_hmac';
      const response = { message: 'Webhook processed' };
      (service.hook as jest.Mock).mockResolvedValue(response);

      const result = await controller.webhook(payload, hmac);
      expect(result).toEqual(response);
      expect(service.hook).toHaveBeenCalledWith(payload, hmac);
    });

    it('should handle webhook with different payload types', async () => {
      const payload = {
        type: 'PAYMENT',
        obj: {
          id: 'payment_456',
          amount: 1000,
        },
      };
      const hmac = 'valid_hmac';
      (service.hook as jest.Mock).mockResolvedValue({ message: 'Processed' });

      await controller.webhook(payload, hmac);
      expect(service.hook).toHaveBeenCalledWith(payload, hmac);
    });
  });
});
