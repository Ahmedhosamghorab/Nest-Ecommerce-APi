import { NotFoundException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Repository, Like, Between } from 'typeorm';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/users/users.service';
/**
 * Service responsible for managing products, including creation, retrieval, and updates.
 */
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepositry: Repository<Product>,
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
    await this.productRepositry.remove(product);
    return { message: 'product deleted successfully' };
  }
}
