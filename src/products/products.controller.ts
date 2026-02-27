import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UpdateProductDto } from './dtos/update-product.dto';
import { CreateProductDto } from './dtos/create-product.dto';
import { ProductService } from './products.service';
@Controller('api/products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}
  // Post: ~/api/products
  @Post()
  public createNewProduct(@Body() body: CreateProductDto) {
    return this.productService.createNewProduct(body);
  }
  // Get: ~/api/products
  @Get()
  public getAllProducts() {
    return this.productService.getAll();
  }
  // Get: ~/api/products/:id
  @Get(':id')
  public getSingleProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getOneBy(id);
  }
  // Put: ~/api/products/:id
  @Put(':id')
  public updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ) {
    return this.productService.update(id, body);
  }
  // Delete: ~/api/products/:id
  @Delete(':id')
  public deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.delete(id);
  }
}
