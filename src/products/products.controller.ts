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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { UpdateProductDto } from './dtos/update-product.dto';
import { CreateProductDto } from './dtos/create-product.dto';
import { ProductService } from './products.service';
import { AuthRolesGuard } from 'src/users/guards/auth-roles.guard';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { UserType } from 'src/utils/enums';
import type { JWTPayload } from 'src/utils/types';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/users/guards/auth.guard';
import type { Response } from 'express';
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
  // POST: ~/api/products/:id/upload-images
  @Post(':id/upload-images')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @UseInterceptors(FilesInterceptor('product-images', 5))
  public async uploadProfileImage(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('id', ParseIntPipe) productId: number,
  ) {
    if (!files || files.length < 1)
      throw new BadRequestException('no files provided');

    const results = await Promise.all(
      files.map((file) =>
        this.productService.addProductImage(productId, file.filename),
      ),
    );

    return results;
  }
  // Delete: ~/api/products/:id
  @Delete(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.delete(id);
  }
  // Delete: ~/api/products/images/:image
  @Delete('images/:image')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public deleteProductImage(@Param('imageId') image: string) {
    return this.productService.deleteProductImage(image);
  }
  // Delete: ~/api/products/:id/images
  @Delete(':id/images')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public deleteAllProductImages(@Param('id', ParseIntPipe) id: number) {
    return this.productService.deleteProductImages(id);
  }
  //GET: ~/api/product/images/:image
  @Get('images/:image')
  @UseGuards(AuthGuard)
  public showProfileImage(@Param('image') image: string, @Res() res: Response) {
    return res.sendFile(image, { root: 'images/products' });
  }
}
