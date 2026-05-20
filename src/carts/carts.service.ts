import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { Product } from 'src/products/product.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { UserVerifiedEvent } from 'src/users/events/user-verified.event';
import type { MessageResponse } from 'src/utils/types';

@Injectable()
export class CartsService {
/**
 * Service constructor injecting dependencies.
 * @param dataSource - TypeORM DataSource.
 * @param cartRepository - Repository for Cart entities.
 * @param cartItemRepository - Repository for CartItem entities.
 */
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  /**
   * Event handler: automatically creates a cart when a user verifies their account.
   * Idempotent — silently skips if the cart already exists.
   */
/**
 * Event handler: automatically creates a cart when a user verifies their account.
 * Idempotent – silently skips if the cart already exists.
 */
  @OnEvent('user.verified')
  public async handleUserVerified(event: UserVerifiedEvent): Promise<void> {
    const existingCart = await this.cartRepository.findOne({
      where: { user: { id: event.userId } },
    });
    if (existingCart) return;
    const cart = this.cartRepository.create({
      user: { id: event.userId },
    });
    await this.cartRepository.save(cart);
  }

  /**
   * GET /cart — Returns the authenticated user's cart with all items and product details.
   * @param userId - The ID of the authenticated user.
   * @returns The cart entity with cartItems and product details.
   */
/**
 * Retrieves the authenticated user's cart with items and product details.
 * @param userId - ID of the authenticated user.
 * @returns The Cart entity.
 */
  public async getCart(userId: number): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!cart) {
      throw new NotFoundException(
        'Cart not found. Please verify your account first.',
      );
    }
    return cart;
  }

  /**
   * POST /cart/add/:productId — Adds a product to the user's cart.
   * If the product already exists in the cart, increases quantity instead of duplicating.
   * Uses a database transaction with pessimistic locking to prevent race conditions.
   * @param userId - The ID of the authenticated user.
   * @param productId - The ID of the product to add.
   * @param dto - Contains the quantity to add.
   * @returns A success message.
   */
/**
 * Adds a product to the user's cart, creating a new cart item or updating quantity.
 * @param userId - ID of the authenticated user.
 * @param productId - ID of the product to add.
 * @param dto - DTO containing quantity.
 * @returns Success message.
 */
  public async addToCart(
    userId: number,
    productId: number,
    dto: AddToCartDto,
  ): Promise<MessageResponse> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['cartItems', 'cartItems.product'],
      });
      if (!cart) {
        throw new NotFoundException(
          'Cart not found. Please verify your account first.',
        );
      }

      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const existingItem = cart.cartItems.find(
        (item) => item.product.id === product.id,
      );

      if (existingItem) {
        const newQty = existingItem.quantity + dto.quantity;
        if (product.quantity < newQty) {
          throw new BadRequestException(
            `Not enough stock. Available: ${product.quantity}, requested total: ${newQty}`,
          );
        }
        existingItem.quantity = newQty;
        await manager.save(CartItem, existingItem);
      } else {
        if (product.quantity < dto.quantity) {
          throw new BadRequestException(
            `Not enough stock. Available: ${product.quantity}, requested: ${dto.quantity}`,
          );
        }
        const cartItem = manager.create(CartItem, {
          cart,
          product,
          quantity: dto.quantity,
        });
        await manager.save(CartItem, cartItem);
      }

      return { message: 'Product added to your cart successfully' };
    });
  }

  /**
   * PATCH /cart/item/:itemId — Updates the quantity of a specific cart item.
   * Validates stock availability and prevents unauthorized access.
   * @param userId - The ID of the authenticated user.
   * @param itemId - The ID of the cart item to update.
   * @param dto - Contains the new quantity.
   * @returns A success message.
   */
/**
 * Updates the quantity of a specific cart item.
 * @param userId - ID of the authenticated user.
 * @param itemId - ID of the cart item.
 * @param dto - DTO with new quantity.
 * @returns Success message.
 */
  public async updateItemQuantity(
    userId: number,
    itemId: number,
    dto: UpdateCartDto,
  ): Promise<MessageResponse> {
    return this.dataSource.transaction(async (manager) => {
      const cartItem = await manager.findOne(CartItem, {
        where: { id: itemId },
        relations: ['cart', 'cart.user', 'product'],
      });
      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }
      if (cartItem.cart.user.id !== userId) {
        throw new BadRequestException("You cannot modify another user's cart");
      }

      const product = await manager.findOne(Product, {
        where: { id: cartItem.product.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException('Product no longer exists');
      }
      if (product.quantity < dto.quantity) {
        throw new BadRequestException(
          `Not enough stock. Available: ${product.quantity}, requested: ${dto.quantity}`,
        );
      }

      cartItem.quantity = dto.quantity;
      await manager.save(CartItem, cartItem);

      return { message: 'Cart item quantity updated successfully' };
    });
  }

  /**
   * DELETE /cart/item/:itemId — Removes a specific item from the user's cart.
   * Validates ownership before deletion.
   * @param userId - The ID of the authenticated user.
   * @param itemId - The ID of the cart item to remove.
   * @returns A success message.
   */
/**
 * Removes a specific item from the user's cart.
 * @param userId - ID of the authenticated user.
 * @param itemId - ID of the cart item to remove.
 * @returns Success message.
 */
  public async removeItem(
    userId: number,
    itemId: number,
  ): Promise<MessageResponse> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: ['cart', 'cart.user'],
    });
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }
    if (cartItem.cart.user.id !== userId) {
      throw new BadRequestException("You cannot modify another user's cart");
    }

    await this.cartItemRepository.remove(cartItem);
    return { message: 'Item removed from cart successfully' };
  }

  /**
   * DELETE /cart/clear — Removes all items from the user's cart.
   * @param userId - The ID of the authenticated user.
   * @returns A success message.
   */
/**
 * Clears all items from the user's cart.
 * @param userId - ID of the authenticated user.
 * @returns Success message.
 */
  public async clearCart(userId: number): Promise<MessageResponse> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['cartItems'],
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    if (cart.cartItems.length === 0) {
      return { message: 'Cart is already empty' };
    }

    await this.cartItemRepository.remove(cart.cartItems);
    return { message: 'Cart cleared successfully' };
  }
}
