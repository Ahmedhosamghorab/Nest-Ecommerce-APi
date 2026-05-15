import { BadRequestException, Injectable } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { Product } from 'src/products/product.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { UserVerifiedEvent } from 'src/users/events/user-verified.event';

@Injectable()
export class CartsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}

  @OnEvent('user.verified')
  public async handleUserVerified(event: UserVerifiedEvent) {
    await this.createNewCart(event.userId);
  }

  public async createNewCart(userId: number) {
    const existingCart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
    });
    if (existingCart) {
      throw new BadRequestException('Cart already exists');
    }
    const cart = this.cartRepository.create({
      user: { id: userId },
    });
    await this.cartRepository.save(cart);
    return;
  }

  findAll() {
    return `This action returns all carts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cart`;
  }

  // update(id: number, updateCartDto: UpdateCartDto) {
  //   return `This action updates a #${id} cart`;
  // }

  remove(id: number) {
    return `This action removes a #${id} cart`;
  }
  public async addToCart(userId: number, productId: number, dto: AddToCartDto) {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['cartItems', 'cartItems.product'],
      });
      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!cart || !product) {
        throw new BadRequestException('Cart or product not found');
      }

      const existingItem = await manager.findOne(CartItem, {
        where: {
          cart: { id: cart.id },
          product: { id: product.id },
        },
      });
      if (existingItem) {
        const newQty = existingItem.quantity + dto.quantity;
        if (product.quantity < newQty) {
          throw new BadRequestException('Out of stock');
        }
        existingItem.quantity = newQty;
        product.quantity -= dto.quantity;
        await manager.save(CartItem, existingItem);
        await manager.save(Product, product);
      } else {
        if (product.quantity < dto.quantity) {
          throw new BadRequestException('Out of stock');
        }
        const cartItem = manager.create(CartItem, {
          cart,
          product,
          quantity: dto.quantity,
        });
        product.quantity -= dto.quantity;
        await manager.save(CartItem, cartItem);
        await manager.save(Product, product);
      }
      await manager.save(Cart, cart);
      return { message: 'product added to your cart successfully' };
    });
  }
}
