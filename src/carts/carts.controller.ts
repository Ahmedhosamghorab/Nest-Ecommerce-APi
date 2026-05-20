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
  HttpStatus,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart } from './entities/cart.entity';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { MessageResponse } from 'src/utils/types';
import type { JWTPayload } from 'src/utils/types';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(AuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @ApiOperation({ summary: "Get current user's cart" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart retrieved successfully.',
    type: Cart,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @Get()
  getCart(@CurrentUser() payload: JWTPayload): Promise<Cart> {
    return this.cartsService.getCart(payload.id);
  }

  @ApiOperation({ summary: 'Add a product to the cart' })
  @ApiParam({ name: 'productId', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product added to cart successfully.',
    type: MessageResponse,
  })
  @ApiBody({ type: AddToCartDto })
  @Post('add/:productId')
  addToCart(
    @CurrentUser() payload: JWTPayload,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<MessageResponse> {
    return this.cartsService.addToCart(payload.id, productId, addToCartDto);
  }

  @ApiOperation({ summary: 'Update quantity of a cart item' })
  @ApiParam({ name: 'itemId', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item quantity updated successfully.',
    type: MessageResponse,
  })
  @ApiBody({ type: UpdateCartDto })
  @Patch('item/:itemId')
  updateItemQuantity(
    @CurrentUser() payload: JWTPayload,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateCartDto: UpdateCartDto,
  ): Promise<MessageResponse> {
    return this.cartsService.updateItemQuantity(
      payload.id,
      itemId,
      updateCartDto,
    );
  }

  @ApiOperation({ summary: 'Remove a specific item from the cart' })
  @ApiParam({ name: 'itemId', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item removed from cart successfully.',
    type: MessageResponse,
  })
  @Delete('item/:itemId')
  removeItem(
    @CurrentUser() payload: JWTPayload,
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<MessageResponse> {
    return this.cartsService.removeItem(payload.id, itemId);
  }

  @ApiOperation({ summary: 'Clear all items from the cart' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart cleared successfully.',
    type: MessageResponse,
  })
  @Delete('clear')
  clearCart(@CurrentUser() payload: JWTPayload): Promise<MessageResponse> {
    return this.cartsService.clearCart(payload.id);
  }
}
