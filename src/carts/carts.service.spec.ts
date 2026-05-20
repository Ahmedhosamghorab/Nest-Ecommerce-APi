import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/product.entity';
import { DataSource, EntityManager } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  createMockRepository,
  MockRepository,
} from '../../test/mocks/repository.mock';
import { TestHelper } from '../../test/utils/test-utils';

describe('CartsService', () => {
  let service: CartsService;
  let cartRepository: MockRepository<Cart>;
  let cartItemRepository: MockRepository<CartItem>;
  let dataSource: jest.Mocked<DataSource>;
  let mockManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      transaction: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
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
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
    cartRepository = module.get(getRepositoryToken(Cart));
    cartItemRepository = module.get(getRepositoryToken(CartItem));
    dataSource = module.get(DataSource);

    // Setup the mock manager for transaction
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(mockManager),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('should return a cart if found', async () => {
      // Arrange
      const cart = { id: 1, user: { id: 1 }, cartItems: [] };
      cartRepository.findOne?.mockResolvedValue(cart as any);

      // Act
      const result = await service.getCart(1);

      // Assert
      expect(result).toEqual(cart);
      expect(cartRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
      });
    });

    it('should throw NotFoundException if cart not found', async () => {
      // Arrange
      cartRepository.findOne?.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getCart(1)).rejects.toThrow(NotFoundException);
      expect(cartRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
      });
    });
  });

  describe('addToCart', () => {
    it('should add a product to cart successfully', async () => {
      // Arrange
      const cart = { id: 1, cartItems: [] };
      const product = { id: 1, quantity: 10 };
      const addToCartDto = { quantity: 2 };

      mockManager.findOne.mockImplementation((entity, options) => {
        if (entity === Cart) return Promise.resolve(cart);
        if (entity === Product) return Promise.resolve(product);
        return Promise.resolve(null);
      });
      mockManager.create.mockReturnValue({ id: 1, quantity: 2 });
      mockManager.save.mockResolvedValue({ id: 1, quantity: 2 });

      // Act
      const result = await service.addToCart(1, 1, addToCartDto);

      // Assert
      expect(result).toEqual({
        message: 'Product added to your cart successfully',
      });
      expect(mockManager.findOne).toHaveBeenCalledWith(Cart, {
        where: { user: { id: 1 } },
        relations: ['cartItems', 'cartItems.product'],
      });
      expect(mockManager.findOne).toHaveBeenCalledWith(Product, {
        where: { id: 1 },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if not enough stock', async () => {
      // Arrange
      const cart = { id: 1, cartItems: [] };
      const product = { id: 1, quantity: 1 };
      const addToCartDto = { quantity: 2 };

      mockManager.findOne.mockImplementation((entity) => {
        if (entity === Cart) return Promise.resolve(cart);
        if (entity === Product) return Promise.resolve(product);
        return Promise.resolve(null);
      });

      // Act & Assert
      await expect(service.addToCart(1, 1, addToCartDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if cart not found', async () => {
      // Arrange
      const addToCartDto = { quantity: 2 };
      mockManager.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addToCart(1, 1, addToCartDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      // Arrange
      const cart = { id: 1, cartItems: [] };
      const addToCartDto = { quantity: 2 };

      mockManager.findOne.mockImplementation((entity) => {
        if (entity === Cart) return Promise.resolve(cart);
        if (entity === Product) return Promise.resolve(null);
        return Promise.resolve(null);
      });

      // Act & Assert
      await expect(service.addToCart(1, 1, addToCartDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update existing cart item quantity', async () => {
      // Arrange
      const existingCartItem = { id: 1, quantity: 1, product: { id: 1 } };
      const cart = { id: 1, cartItems: [existingCartItem] };
      const product = { id: 1, quantity: 10 };
      const addToCartDto = { quantity: 2 };

      mockManager.findOne.mockImplementation((entity) => {
        if (entity === Cart) return Promise.resolve(cart);
        if (entity === Product) return Promise.resolve(product);
        return Promise.resolve(null);
      });
      mockManager.save.mockResolvedValue(existingCartItem);

      // Act
      const result = await service.addToCart(1, 1, addToCartDto);

      // Assert
      expect(result).toEqual({
        message: 'Product added to your cart successfully',
      });
      expect(existingCartItem.quantity).toBe(3); // 1 + 2
      expect(mockManager.save).toHaveBeenCalledWith(CartItem, existingCartItem);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update cart item quantity successfully', async () => {
      // Arrange
      const cartItem = {
        id: 1,
        quantity: 2,
        cart: { user: { id: 1 } },
        product: { id: 1 },
      };
      const product = { id: 1, quantity: 10 };
      const updateDto = { quantity: 3 };

      mockManager.findOne.mockImplementation((entity) => {
        if (entity === CartItem) return Promise.resolve(cartItem);
        if (entity === Product) return Promise.resolve(product);
        return Promise.resolve(null);
      });
      mockManager.save.mockResolvedValue(cartItem);

      // Act
      const result = await service.updateItemQuantity(1, 1, updateDto);

      // Assert
      expect(result).toEqual({
        message: 'Cart item quantity updated successfully',
      });
      expect(cartItem.quantity).toBe(3);
      expect(mockManager.save).toHaveBeenCalledWith(CartItem, cartItem);
    });

    it('should throw NotFoundException if cart item not found', async () => {
      // Arrange
      const updateDto = { quantity: 3 };
      mockManager.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateItemQuantity(1, 1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user tries to modify another users cart', async () => {
      // Arrange
      const cartItem = {
        id: 1,
        quantity: 2,
        cart: { user: { id: 2 } }, // Different user
        product: { id: 1 },
      };
      const updateDto = { quantity: 3 };
      mockManager.findOne.mockResolvedValue(cartItem);

      // Act & Assert
      await expect(service.updateItemQuantity(1, 1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeItem', () => {
    it('should remove cart item successfully', async () => {
      // Arrange
      const cartItem = {
        id: 1,
        cart: { user: { id: 1 } },
      };
      cartItemRepository.findOne?.mockResolvedValue(cartItem as any);
      cartItemRepository.remove?.mockResolvedValue(cartItem as any);

      // Act
      const result = await service.removeItem(1, 1);

      // Assert
      expect(result).toEqual({
        message: 'Item removed from cart successfully',
      });
      expect(cartItemRepository.remove).toHaveBeenCalledWith(cartItem);
    });

    it('should throw NotFoundException if cart item not found', async () => {
      // Arrange
      cartItemRepository.findOne?.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeItem(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearCart', () => {
    it('should clear cart successfully', async () => {
      // Arrange
      const cartItems = [{ id: 1 }, { id: 2 }];
      const cart = { id: 1, cartItems };
      cartRepository.findOne?.mockResolvedValue(cart as any);
      cartItemRepository.remove?.mockResolvedValue(cartItems as any);

      // Act
      const result = await service.clearCart(1);

      // Assert
      expect(result).toEqual({
        message: 'Cart cleared successfully',
      });
      expect(cartItemRepository.remove).toHaveBeenCalledWith(cartItems);
    });

    it('should return message if cart is already empty', async () => {
      // Arrange
      const cart = { id: 1, cartItems: [] };
      cartRepository.findOne?.mockResolvedValue(cart as any);

      // Act
      const result = await service.clearCart(1);

      // Assert
      expect(result).toEqual({
        message: 'Cart is already empty',
      });
      expect(cartItemRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('handleUserVerified', () => {
    it('should create cart for verified user', async () => {
      // Arrange
      const event = { userId: 1 };
      cartRepository.findOne?.mockResolvedValue(null);
      cartRepository.create?.mockReturnValue({ id: 1, user: { id: 1 } } as any);
      cartRepository.save?.mockResolvedValue({ id: 1, user: { id: 1 } } as any);

      // Act
      await service.handleUserVerified(event);

      // Assert
      expect(cartRepository.create).toHaveBeenCalledWith({
        user: { id: 1 },
      });
      expect(cartRepository.save).toHaveBeenCalled();
    });

    it('should skip if cart already exists', async () => {
      // Arrange
      const event = { userId: 1 };
      const existingCart = { id: 1, user: { id: 1 } };
      cartRepository.findOne?.mockResolvedValue(existingCart as any);

      // Act
      await service.handleUserVerified(event);

      // Assert
      expect(cartRepository.create).not.toHaveBeenCalled();
      expect(cartRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error scenarios', () => {
    it('should handle database errors during getCart', async () => {
      // Arrange
      cartRepository.findOne?.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getCart(1)).rejects.toThrow('Database error');
    });

    it('should handle transaction errors during addToCart', async () => {
      // Arrange
      const addToCartDto = { quantity: 2 };
      (dataSource.transaction as jest.Mock).mockRejectedValue(
        new Error('Transaction error'),
      );

      // Act & Assert
      await expect(service.addToCart(1, 1, addToCartDto)).rejects.toThrow(
        'Transaction error',
      );
    });
  });
});
