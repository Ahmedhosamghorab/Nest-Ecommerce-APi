import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { DataSource } from 'typeorm';
import { CartsService } from '../carts/carts.service';
import { PaymobService } from '../paymob/paymob.service';
import { createMockRepository, MockRepository } from '../../test/mocks/repository.mock';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from './enums/order-status.enum';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: MockRepository<Order>;
  let cartsService: any;
  let paymobService: any;
  let dataSource: any;

  const mockManager = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: createMockRepository<Order>(),
        },
        {
          provide: CartsService,
          useValue: {
            getCart: jest.fn(),
            clearCart: jest.fn(),
          },
        },
        {
          provide: PaymobService,
          useValue: {
            createPaymentIntention: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb) => cb(mockManager)),
            createQueryRunner: jest.fn(() => ({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                findOne: jest.fn(),
                save: jest.fn(),
              },
            })),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get(getRepositoryToken(Order));
    cartsService = module.get(CartsService);
    paymobService = module.get(PaymobService);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkout', () => {
    it('should create an order and return payment URL', async () => {
      const cart = {
        cartItems: [
          { product: { id: 1, price: 100, quantity: 10, title: 'Product' }, quantity: 2 },
        ],
      };
      cartsService.getCart.mockResolvedValue(cart);
      mockManager.create.mockReturnValue({});
      mockManager.save.mockResolvedValue({ id: 1, totalPrice: 200 });
      paymobService.createPaymentIntention.mockResolvedValue({
        paymobIntentionId: '123',
        paymentUrl: 'http://pay.me',
      });

      const result = await service.checkout(1, {} as any);
      expect(result).toHaveProperty('paymentUrl', 'http://pay.me');
      expect(orderRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if cart is empty', async () => {
      cartsService.getCart.mockResolvedValue({ cartItems: [] });
      await expect(service.checkout(1, {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if product out of stock', async () => {
      const cart = {
        cartItems: [
          { product: { id: 1, price: 100, quantity: 1, title: 'Product' }, quantity: 2 },
        ],
      };
      cartsService.getCart.mockResolvedValue(cart);
      await expect(service.checkout(1, {} as any)).rejects.toThrow(BadRequestException);
    });
  });
});
