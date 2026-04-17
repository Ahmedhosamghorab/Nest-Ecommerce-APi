import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { UserService } from 'src/users/users.service';
import { ProductService } from 'src/products/products.service';
@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly usersService: UserService,
    private readonly productsService: ProductService,
  ) {}
  /**
   *
   * @param dto
   * @returns
   */
  public async createNewReview(
    productId: number,
    userId: number,
    dto: CreateReviewDto,
  ) {
    const user = await this.usersService.getCurrentUser(userId);
    const product = await this.productsService.getOneBy(productId);
    const newReview = this.reviewRepository.create({ ...dto, user, product });
    return this.reviewRepository.save(newReview);
  }
  /**
   *
   * @returns
   */
  public getAll() {
    const reviews = this.reviewRepository.find();
    return reviews;
  }
  /**
   *
   * @param id
   * @returns
   */
  public async getOneBy(id: number) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new NotFoundException();
    return review;
  }
  /**
   *
   * @param id
   * @param dto
   * @returns
   */
  public async update(id: number, dto: UpdateReviewDto) {
    const review = await this.getOneBy(id);
    review.rate = dto.rate ?? review.rate;
    review.comment = dto.comment ?? review.comment;
    return this.reviewRepository.save(review);
  }
  /**
   *
   * @param id
   * @returns
   */
  public async delete(id: number) {
    const review = await this.getOneBy(id);
    await this.reviewRepository.remove(review);
    return { message: 'review deleted successfully' };
  }
}
