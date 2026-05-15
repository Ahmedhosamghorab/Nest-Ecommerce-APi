import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import type { JWTPayload } from 'src/utils/types';
import { AuthGuard } from 'src/users/guards/auth.guard';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  // @Post()
  // create(@Body() createCartDto: CreateCartDto) {
  //   return this.cartsService.create(createCartDto);
  // }

  @Get()
  findAll() {
    return this.cartsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartsService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
  //   return this.cartsService.update(+id, updateCartDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartsService.remove(+id);
  }

  @Post('/:productId')
  @UseGuards(AuthGuard)
  addToCart(
    @CurrentUser() payload: JWTPayload,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartsService.addToCart(payload.id, +productId, addToCartDto);
  }
}
