import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './enums/order-status.enum';
import { CartsService } from 'src/carts/carts.service';
import { PaymobService } from 'src/paymob/paymob.service';
import { Product } from 'src/products/product.entity';
import type { BillingData, CheckoutResponse } from 'src/utils/types';

@Injectable()
/**
 * Service handling order operations, checkout flow, and payment callbacks.
 */
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  /**
   * Service constructor injecting dependencies.
   * @param dataSource - TypeORM data source.
   * @param orderRepository - Repository for Order entities.
   * @param cartsService - Service handling cart operations.
   * @param paymobService - Service handling Paymob payments.
   */
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly cartsService: CartsService,
    private readonly paymobService: PaymobService,
  ) {}

  /**
   * Retrieve all orders belonging to a user.
   * @param userId - ID of the user whose orders are fetched.
   * @returns A promise resolving to an array of Order entities.
   */
  async getAll(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['orderItems', 'orderItems.product'],
    });
  }

  /**
   * Retrieve a specific order for a user.
   * @param userId - ID of the user.
   * @param orderId - ID of the order to retrieve.
   * @returns The Order entity if found.
   * @throws NotFoundException if the order does not exist.
   */
  async getOneBy(userId: number, orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['orderItems', 'orderItems.product'],
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  /**
   * Main checkout flow:
   * 1. Validate cart and stock.
   * 2. Create local order with PENDING status and order items.
   * 3. Create Paymob payment intention.
   * 4. Return payment URL.
   */
  async checkout(
    userId: number,
    billingData: BillingData,
  ): Promise<CheckoutResponse> {
    const cart = await this.cartsService.getCart(userId);

    if (!cart || cart.cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Initial validation of stock
    for (const item of cart.cartItems) {
      if (item.product.quantity < item.quantity) {
        throw new BadRequestException(`${item.product.title} is out of stock`);
      }
    }

    // Step 1: Create local order and items
    // We use a transaction here to ensure order and items are saved together
    const savedOrder = await this.dataSource.transaction(async (manager) => {
      let totalPrice = 0;

      const order = manager.create(Order, {
        totalPrice: 0, // Will update below
        status: OrderStatus.PENDING,
        user: { id: userId },
      });

      const initialOrder = await manager.save(order);

      const orderItems: OrderItem[] = [];
      for (const cartItem of cart.cartItems) {
        const itemPrice = cartItem.product.price * cartItem.quantity;
        totalPrice += itemPrice;

        const orderItem = manager.create(OrderItem, {
          order: initialOrder,
          product: cartItem.product,
          quantity: cartItem.quantity,
          priceAtPurchase: cartItem.product.price,
        });
        orderItems.push(orderItem);
      }

      await manager.save(OrderItem, orderItems);

      initialOrder.totalPrice = totalPrice;
      return await manager.save(initialOrder);
    });

    // Step 2: Create Paymob Intention (Outside DB transaction)
    try {
      const payment = await this.paymobService.createPaymentIntention(
        savedOrder.totalPrice,
        savedOrder.id,
        billingData,
      );

      // Step 3: Update order with Paymob reference
      savedOrder.paymobOrderId = payment.paymobIntentionId.toString();
      await this.orderRepository.save(savedOrder);

      return {
        orderId: savedOrder.id,
        paymentUrl: payment.paymentUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to initiate Paymob for order ${savedOrder.id}:`,
        message,
      );
      // We keep the order as PENDING/FAILED or we could delete it,
      // but keeping it as PENDING allows for retry if implemented.
      throw error;
    }
  }

  /**
   * Webhook handler for successful payment:
   * 1. Validate order status (idempotency).
   * 2. Deduct stock using pessimistic locking.
   * 3. Update order status to PAID.
   * 4. Clear user cart.
   */
  /**
   * Handles successful payment webhook.
   * Performs idempotency check, stock deduction, order status update, and cart clearance.
   * @param orderId - ID of the order that was paid.
   */
  async handleSuccessfulPayment(orderId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ['orderItems', 'orderItems.product', 'user'],
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found in webhook`);
        await queryRunner.rollbackTransaction();
        return;
      }

      // Idempotency check: if order is already paid, skip
      if (order.status === OrderStatus.PAID) {
        this.logger.log(`Order ${orderId} is already marked as PAID`);
        await queryRunner.rollbackTransaction();
        return;
      }

      this.logger.log(`Processing successful payment for Order ${orderId}`);

      // Deduct stock for each item
      for (const item of order.orderItems) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.product.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.product.id} not found`);
        }

        if (product.quantity < item.quantity) {
          this.logger.error(
            `Insufficient stock for product ${product.id} in order ${orderId}`,
          );
          // In a real production system, you might flag this for manual review or auto-refund
          throw new BadRequestException(
            `Insufficient stock for product ${product.title}`,
          );
        }

        product.quantity -= item.quantity;
        await queryRunner.manager.save(product);
      }

      // Update order status
      order.status = OrderStatus.PAID;
      await queryRunner.manager.save(order);

      // Commit transaction after stock deduction and order update
      await queryRunner.commitTransaction();

      // Clear cart (outside main transaction to avoid blocking cart operations if it fails)
      try {
        await this.cartsService.clearCart(order.user.id);
      } catch (cartError) {
        const cartErrorMessage =
          cartError instanceof Error ? cartError.message : 'Unknown error';
        this.logger.error(
          `Failed to clear cart for user ${order.user.id}:`,
          cartErrorMessage,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error handling successful payment for order ${orderId}:`,
        message,
      );
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Handle failed payment webhook
   */
  /**
   * Handles failed payment webhook.
   * Marks the order as FAILED if it is still pending.
   * @param orderId - ID of the order that failed payment.
   */
  async handleFailedPayment(orderId: number): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (order && order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.FAILED;
      await this.orderRepository.save(order);
      this.logger.log(`Order ${orderId} marked as FAILED`);
    }
  }
}
