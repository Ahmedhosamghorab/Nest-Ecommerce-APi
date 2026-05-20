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
  HttpStatus,
} from '@nestjs/common';
import { UpdateProductDto } from './dtos/update-product.dto';
import { CreateProductDto } from './dtos/create-product.dto';
import { ProductService } from './products.service';
import { AuthRolesGuard } from 'src/auth/guards/auth-roles.guard';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { UserType } from 'src/utils/enums';
import { MessageResponse } from 'src/utils/types';
import type { JWTPayload } from 'src/utils/types';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import type { Response } from 'express';
import { Product } from './product.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully.',
    type: Product,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @ApiBody({ type: CreateProductDto })
  @Post()
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public createNewProduct(
    @Body() body: CreateProductDto,
    @CurrentUser() payload: JWTPayload,
  ): Promise<Product> {
    return this.productService.createNewProduct(body, payload.id);
  }

  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'title', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: String })
  @ApiQuery({ name: 'maxPrice', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully.',
    type: [Product],
  })
  @Get()
  public getAllProducts(
    @Query('title') title?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<Product[]> {
    return this.productService.getAll(
      title,
      minPrice,
      maxPrice,
      categoryId ? parseInt(categoryId, 10) : undefined,
    );
  }

  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product retrieved successfully.',
    type: Product,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found.' })
  @Get(':id')
  public getSingleProduct(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Product> {
    return this.productService.getOneBy(id);
  }

  @ApiOperation({ summary: 'Update a product (Admin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully.',
    type: Product,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found.' })
  @ApiBody({ type: UpdateProductDto })
  @Put(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.update(id, body);
  }

  @ApiOperation({ summary: 'Upload product images (Admin only)' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        'product-images': {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Images uploaded successfully.',
    type: [MessageResponse],
  })
  @Post(':id/upload-images')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @UseInterceptors(FilesInterceptor('product-images', 5))
  public async uploadProfileImage(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('id', ParseIntPipe) productId: number,
  ): Promise<MessageResponse[]> {
    if (!files || files.length < 1)
      throw new BadRequestException('no files provided');

    const results = await Promise.all(
      files.map((file) =>
        this.productService.addProductImage(productId, file.filename),
      ),
    );

    return results;
  }

  @ApiOperation({ summary: 'Delete a product (Admin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product deleted successfully.',
    type: MessageResponse,
  })
  @Delete(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public deleteProduct(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MessageResponse> {
    return this.productService.delete(id);
  }

  @ApiOperation({ summary: 'Delete a product image (Admin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'image', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image deleted successfully.',
    type: MessageResponse,
  })
  @Delete('images/:image')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public deleteProductImage(
    @Param('image') image: string,
  ): Promise<MessageResponse> {
    return this.productService.deleteProductImage(image);
  }

  @ApiOperation({ summary: 'Delete all images for a product (Admin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All images deleted successfully.',
    type: MessageResponse,
  })
  @Delete(':id/images')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public deleteAllProductImages(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MessageResponse> {
    return this.productService.deleteProductImages(id);
  }

  @ApiOperation({ summary: 'Show product image' })
  @ApiParam({ name: 'image', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image returned.' })
  @Get('images/:image')
  @UseGuards(AuthGuard)
  public showProfileImage(
    @Param('image') image: string,
    @Res() res: Response,
  ): void {
    return res.sendFile(image, { root: 'images/products' });
  }
}
