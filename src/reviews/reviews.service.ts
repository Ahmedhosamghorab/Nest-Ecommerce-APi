import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { UserService } from 'src/users/users.service';
import { ProductService } from 'src/products/products.service';
import { JWTPayload } from 'src/utils/types';
import { UserType } from 'src/utils/enums';
/**
 * Service responsible for managing product reviews, including creation, retrieval, updates, and deletion.
 */
@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly usersService: UserService,
    private readonly productsService: ProductService,
  ) {}

  /**
   * Creates a new review for a product.
   * @param productId - The ID of the product being reviewed.
   * @param userId - The ID of the user creating the review.
   * @param dto - The data for the review (rating and comment).
   * @returns A promise that resolves to the newly created review.
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
   * Retrieves all reviews with pagination, ordered by creation date (newest first).
   * @param pageNumber - The page number to retrieve.
   * @param reviewPerPage - The number of reviews to display per page.
   * @returns A promise that resolves to an array of reviews.
   */
  public getAll(pageNumber: number, reviewPerPage: number) {
    const reviews = this.reviewRepository.find({
      skip: reviewPerPage * (pageNumber - 1),
      take: reviewPerPage,
      order: { createdAt: 'DESC' },
    });
    return reviews;
  }

  /**
   * Updates an existing review.
   * @param userId - The ID of the user requesting the update (to verify ownership).
   * @param id - The ID of the review to update.
   * @param dto - The updated data (rating or comment).
   * @returns A promise that resolves to the updated review.
   * @throws ForbiddenException if the user is not the author of the review.
   */
  public async update(userId: number, id: number, dto: UpdateReviewDto) {
    const review = await this.getOneBy(id);
    if (review.user.id != userId)
      throw new ForbiddenException('access denied, you are not allowed');
    review.rate = dto.rate ?? review.rate;
    review.comment = dto.comment ?? review.comment;
    return this.reviewRepository.save(review);
  }

  /**
   * Deletes a review from the system.
   * @param payload - The JWT payload of the user attempting to delete the review.
   * @param id - The ID of the review to delete.
   * @returns A promise that resolves to a success message.
   * @throws ForbiddenException if the user is not the author and not an admin.
   */
  public async delete(payload: JWTPayload, id: number) {
    const review = await this.getOneBy(id);
    if (review.user.id == payload.id || payload.userType === UserType.ADMIN) {
      await this.reviewRepository.remove(review);
      return { message: 'review deleted successfully' };
    }
    throw new ForbiddenException('access denied, you are not allowed');
  }

  /**
   * Retrieves a single review by its ID.
   * @param id - The unique identifier of the review.
   * @returns A promise that resolves to the review entity.
   * @throws NotFoundException if the review does not exist.
   */
  public async getOneBy(id: number) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new NotFoundException();
    return review;
  }
}
