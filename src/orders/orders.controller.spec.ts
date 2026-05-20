import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { createFakeOrder } from '../../test/fixtures/order.fixture';
import { NotFoundException } from '@nestjs/common';
import type { JWTPayload } from 'src/utils/types';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockUser: JWTPayload = {
    id: 1,
    userType: 'NORMAL_USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            checkout: jest.fn(),
            getAll: jest.fn(),
            getOneBy: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkout', () => {
    it('should create an order and return payment URL', async () => {
      const checkoutDto = {
        shippingAddress: '123 Main St',
        phoneNumber: '1234567890',
      };
      const response = {
        paymentUrl: 'https://payment.url',
        paymobIntentionId: 'intention_123',
      };
      (service.checkout as jest.Mock).mockResolvedValue(response);

      const result = await controller.checkout(mockUser, checkoutDto);
      expect(result).toEqual(response);
      expect(service.checkout).toHaveBeenCalledWith(mockUser.id, checkoutDto);
    });
  });

  describe('getOrders', () => {
    it('should return all orders for the user', async () => {
      const orders = [createFakeOrder(), createFakeOrder()];
      (service.getAll as jest.Mock).mockResolvedValue(orders);

      const result = await controller.getOrders(mockUser);
      expect(result).toEqual(orders);
      expect(service.getAll).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return empty array if no orders', async () => {
      (service.getAll as jest.Mock).mockResolvedValue([]);

      const result = await controller.getOrders(mockUser);
      expect(result).toEqual([]);
    });
  });

  describe('getOrderDetails', () => {
    it('should return order details', async () => {
      const order = createFakeOrder();
      (service.getOneBy as jest.Mock).mockResolvedValue(order);

      const result = await controller.getOrderDetails(mockUser, 1);
      expect(result).toEqual(order);
      expect(service.getOneBy).toHaveBeenCalledWith(mockUser.id, 1);
    });

    it('should throw NotFoundException if order not found', async () => {
      (service.getOneBy as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.getOrderDetails(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
