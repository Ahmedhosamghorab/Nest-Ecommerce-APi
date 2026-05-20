import { Test, TestingModule } from '@nestjs/testing';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createMockRepository } from '../../test/mocks/repository.mock';
import { TestHelper } from '../../test/utils/test-utils';
import {
  createFakeCart,
  createFakeCartWithItems,
} from '../../test/fixtures/cart.fixture';
import { NotFoundException } from '@nestjs/common';

describe('CartsController', () => {
  let controller: CartsController;
  let service: CartsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartsController],
      providers: [
        CartsService,
        {
          provide: getRepositoryToken(Cart),
          useValue: createMockRepository<Cart>(),
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: createMockRepository<CartItem>(),
        },
        {
          provide: DataSource,
          useValue: TestHelper.createMockDataSource(),
        },
        {
          provide: JwtService,
          useValue: TestHelper.createMockJwtService(),
        },
        {
          provide: ConfigService,
          useValue: TestHelper.createMockConfigService(),
        },
      ],
    }).compile();

    controller = module.get<CartsController>(CartsController);
    service = module.get<CartsService>(CartsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCart', () => {
    it('should return user cart successfully', async () => {
      // Arrange
      const mockCart = createFakeCartWithItems(2);
      const mockUser = { id: 1, userType: 'normal_user' };
      jest.spyOn(service, 'getCart').mockResolvedValue(mockCart);

      // Act
      const result = await controller.getCart(mockUser as any);

      // Assert
      expect(result).toEqual(mockCart);
      expect(service.getCart).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when cart not found', async () => {
      // Arrange
      const mockUser = { id: 1, userType: 'normal_user' };
      jest
        .spyOn(service, 'getCart')
        .mockRejectedValue(new NotFoundException('Cart not found'));

      // Act & Assert
      await expect(controller.getCart(mockUser as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.getCart).toHaveBeenCalledWith(1);
    });
  });

  describe('addToCart', () => {
    it('should add product to cart successfully', async () => {
      // Arrange
      const mockUser = { id: 1, userType: 'normal_user' };
      const addToCartDto = { quantity: 2 };
      const productId = 1;
      const expectedResponse = {
        message: 'Product added to your cart successfully',
      };

      jest.spyOn(service, 'addToCart').mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.addToCart(
        mockUser as any,
        productId,
        addToCartDto,
      );

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.addToCart).toHaveBeenCalledWith(
        1,
        productId,
        addToCartDto,
      );
    });

    it('should handle service errors when adding to cart', async () => {
      // Arrange
      const mockUser = { id: 1, userType: 'normal_user' };
      const addToCartDto = { quantity: 2 };
      const productId = 1;

      jest
        .spyOn(service, 'addToCart')
        .mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(
        controller.addToCart(mockUser as any, productId, addToCartDto),
      ).rejects.toThrow('Service error');
      expect(service.addToCart).toHaveBeenCalledWith(
        1,
        productId,
        addToCartDto,
      );
    });
  });

  describe('updateItemQuantity', () => {
    it('should update cart item successfully', async () => {
      // Arrange
      const mockUser = { id: 1, userType: 'normal_user' };
      const updateCartDto = { quantity: 3 };
      const cartItemId = 1;
      const expectedResponse = {
        message: 'Cart item quantity updated successfully',
      };

      jest
        .spyOn(service, 'updateItemQuantity')
        .mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.updateItemQuantity(
        mockUser as any,
        cartItemId,
        updateCartDto,
      );

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.updateItemQuantity).toHaveBeenCalledWith(
        1,
        cartItemId,
        updateCartDto,
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart successfully', async () => {
      // Arrange
      const mockUser = { id: 1, userType: 'normal_user' };
      const cartItemId = 1;
      const expectedResponse = {
        message: 'Item removed from cart successfully',
      };

      jest.spyOn(service, 'removeItem').mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.removeItem(mockUser as any, cartItemId);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.removeItem).toHaveBeenCalledWith(1, cartItemId);
    });
  });

  describe('clearCart', () => {
    it('should clear cart successfully', async () => {
      // Arrange
      const mockUser = { id: 1, userType: 'normal_user' };
      const expectedResponse = { message: 'Cart cleared successfully' };

      jest.spyOn(service, 'clearCart').mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.clearCart(mockUser as any);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.clearCart).toHaveBeenCalledWith(1);
    });
  });
});
