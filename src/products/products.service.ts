import { NotFoundException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/users/users.service';
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepositry: Repository<Product>,
    private readonly userService: UserService,
  ) {}
  /**
   * Create New Product
   * @param param0
   * @returns
   */
  public async createNewProduct(dto: CreateProductDto, userId: number) {
    const user = await this.userService.getCurrentUser(userId);
    const newProduct = this.productRepositry.create({
      ...dto,
      user,
    });
    return this.productRepositry.save(newProduct);
  }
  /**
   * Get All Products
   * @returns
   */
  public getAll() {
    return this.productRepositry.find();
  }
  /**
   * Get One Product By Id
   * @param id
   * @returns
   */
  public async getOneBy(id: number) {
    const product = await this.productRepositry.findOne({ where: { id } });
    if (!product) throw new NotFoundException();
    return product;
  }
  /**
   * Update Product
   * @param id
   * @param param1
   * @returns
   */
  public async update(id: number, dto: UpdateProductDto) {
    const product = await this.getOneBy(id);
    product.title = dto.title ?? product.title;
    product.price = dto.price ?? product.price;
    product.description = dto.description ?? product.description;

    return this.productRepositry.save(product);
  }
  /**
   * Delete Product
   * @param id
   * @returns
   */
  public async delete(id: number) {
    const product = await this.getOneBy(id);
    await this.productRepositry.remove(product);
    return { message: 'product deleted successfully' };
  }
}
