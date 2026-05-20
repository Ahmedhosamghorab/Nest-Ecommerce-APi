import { Review } from '../../src/reviews/review.entity';
import { createFakeUser } from './user.fixture';
import { createFakeProduct } from './product.fixture';

export const createFakeReview = (overrides: Partial<Review> = {}): Review => {
  const review = new Review();
  review.id = 1;
  review.rate = 5;
  review.comment = 'Great product!';
  review.user = createFakeUser();
  review.product = createFakeProduct();
  review.createdAt = new Date();
  review.updatedAt = new Date();

  return { ...review, ...overrides } as Review;
};
