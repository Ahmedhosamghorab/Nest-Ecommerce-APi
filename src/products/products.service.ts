import { NotFoundException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Repository, Like, Between } from 'typeorm';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/users/users.service';
import { ProductImage } from './product_image.entity';
import * as fs from 'fs';
import * as path from 'path';
/**
 * Service responsible for managing products, including creation, retrieval, and updates.
 */
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepositry: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepositry: Repository<ProductImage>,
    private readonly userService: UserService,
  ) {}

  /**
   * Creates a new product for a specific user.
   * @param dto - The data required to create a new product.
   * @param userId - The ID of the user who owns the product.
   * @returns A promise that resolves to the newly created product.
   */
  public async createNewProduct(dto: CreateProductDto, userId: number) {
    const user = await this.userService.getCurrentUser(userId);
    const newProduct = this.productRepositry.create({
      ...dto,
      title: dto.title.toLowerCase(),
      user,
    });
    return this.productRepositry.save(newProduct);
  }

  /**
   * Retrieves a list of all products, with optional filters for title and price range.
   * @param title - Optional search term to filter products by title (case-insensitive).
   * @param minPrice - Optional minimum price to filter products.
   * @param maxPrice - Optional maximum price to filter products.
   * @returns A promise that resolves to an array of products matching the criteria.
   */
  public getAll(title?: string, minPrice?: string, maxPrice?: string) {
    const filters = {
      ...(title ? { title: Like(`%${title.toLowerCase()}%`) } : {}),
      ...(minPrice && maxPrice
        ? { price: Between(parseInt(minPrice), parseInt(maxPrice)) }
        : {}),
    };
    return this.productRepositry.find({ where: filters });
  }

  /**
   * Retrieves a single product by its ID.
   * @param id - The unique identifier of the product.
   * @returns A promise that resolves to the product entity.
   * @throws NotFoundException if the product does not exist.
   */
  public async getOneBy(id: number) {
    const product = await this.productRepositry.findOne({ where: { id } });
    if (!product) throw new NotFoundException();
    return product;
  }

  /**
   * Updates an existing product's details.
   * @param id - The ID of the product to update.
   * @param dto - The data to update (title, price, description).
   * @returns A promise that resolves to the updated product.
   */
  public async update(id: number, dto: UpdateProductDto) {
    const product = await this.getOneBy(id);
    product.title = dto.title ?? product.title;
    product.price = dto.price ?? product.price;
    product.description = dto.description ?? product.description;

    return this.productRepositry.save(product);
  }

  /**
   * Deletes a product from the database.
   * @param id - The ID of the product to delete.
   * @returns A promise that resolves to a success message.
   */
  public async delete(id: number) {
    const product = await this.getOneBy(id);
    // Delete image files from disk
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        const imagePath = path.join('images', 'products', img.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    await this.productRepositry.remove(product);
    return { message: 'product deleted successfully' };
  }
  public async addProductImage(id: number, image: string) {
    const product = await this.getOneBy(id);
    const productImage = this.productImageRepositry.create({
      image,
      product,
    });
    await this.productImageRepositry.save(productImage);
    return { message: 'images added successfully' };
  }

  /**
   * Deletes a single product image by its ID and removes the file from disk.
   * @param imageId - The ID of the product image to delete.
   * @returns A promise that resolves to a success message.
   * @throws NotFoundException if the image does not exist.
   */
  public async deleteProductImage(image: string) {
    const productImage = await this.productImageRepositry.findOne({
      where: { image: image },
    });
    if (!productImage) throw new NotFoundException('image not found');

    // Delete file from disk
    const imagePath = path.join('images', 'products', productImage.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await this.productImageRepositry.remove(productImage);
    return { message: 'image deleted successfully' };
  }

  /**
   * Deletes all images for a specific product and removes the files from disk.
   * @param productId - The ID of the product whose images should be deleted.
   * @returns A promise that resolves to a success message.
   */
  public async deleteProductImages(productId: number) {
    const product = await this.getOneBy(productId);
    const images = await this.productImageRepositry.find({
      where: { product: { id: product.id } },
    });

    // Delete files from disk
    for (const img of images) {
      const imagePath = path.join('images', 'products', img.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await this.productImageRepositry.remove(images);
    return { message: 'all product images deleted successfully' };
  }
}
