import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import type { JWTPayload } from 'src/utils/types';
import { AuthGuard } from 'src/users/guards/auth.guard';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  // GET ~/api/cart — get the current user's cart with all items & product details
  @Get()
  getCart(@CurrentUser() payload: JWTPayload) {
    return this.cartsService.getCart(payload.id);
  }

  // POST ~/api/cart/add/:productId — add a product to the cart
  @Post('add/:productId')
  addToCart(
    @CurrentUser() payload: JWTPayload,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartsService.addToCart(payload.id, productId, addToCartDto);
  }

  // PATCH ~/api/cart/item/:itemId — update quantity of a cart item
  @Patch('item/:itemId')
  updateItemQuantity(
    @CurrentUser() payload: JWTPayload,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateCartDto: UpdateCartDto,
  ) {
    return this.cartsService.updateItemQuantity(
      payload.id,
      itemId,
      updateCartDto,
    );
  }

  // DELETE ~/api/cart/item/:itemId — remove a specific item from the cart
  @Delete('item/:itemId')
  removeItem(
    @CurrentUser() payload: JWTPayload,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.cartsService.removeItem(payload.id, itemId);
  }

  // DELETE ~/api/cart/clear — clear all items from the cart
  @Delete('clear')
  clearCart(@CurrentUser() payload: JWTPayload) {
    return this.cartsService.clearCart(payload.id);
  }
}
