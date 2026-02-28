import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UpdateProductDto } from './dtos/update-product.dto';
import { CreateProductDto } from './dtos/create-product.dto';
import { ProductService } from './products.service';
import { AuthRolesGuard } from 'src/users/guards/auth-roles.guard';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { UserType } from 'src/utils/enums';
import type { JWTPayload } from 'src/utils/types';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
@Controller('api/products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}
  // Post: ~/api/products
  @Post()
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public createNewProduct(
    @Body() body: CreateProductDto,
    @CurrentUser() payload: JWTPayload,
  ) {
    return this.productService.createNewProduct(body, payload.id);
  }
  // Get: ~/api/products
  @Get()
  public getAllProducts(
    @Query('title') title: string,
    @Query('minPrice') minPrice: string,
    @Query('maxPrice') maxPrice: string,
  ) {
    return this.productService.getAll(title, minPrice, maxPrice);
  }
  // Get: ~/api/products/:id
  @Get(':id')
  public getSingleProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getOneBy(id);
  }
  // Put: ~/api/products/:id
  @Put(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ) {
    return this.productService.update(id, body);
  }
  // Delete: ~/api/products/:id
  @Delete(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.delete(id);
  }
}
