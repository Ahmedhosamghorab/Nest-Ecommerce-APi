import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './reviews.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { UserService } from '../users/users.service';
import { ProductService } from '../products/products.service';
import { createMockRepository, MockRepository } from '../../test/mocks/repository.mock';
import { createMockUserService } from '../../test/mocks/user.service.mock';
import { createFakeReview } from '../../test/fixtures/review.fixture';
import { createFakeUser } from '../../test/fixtures/user.fixture';
import { createFakeProduct } from '../../test/fixtures/product.fixture';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserType } from '../utils/enums';

describe('ReviewService', () => {
  let service: ReviewService;
  let repository: MockRepository<Review>;
  let userService: any;
  let productService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: getRepositoryToken(Review),
          useValue: createMockRepository<Review>(),
        },
        {
          provide: UserService,
          useValue: createMockUserService(),
        },
        {
          provide: ProductService,
          useValue: {
            getOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    repository = module.get(getRepositoryToken(Review));
    userService = module.get(UserService);
    productService = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNewReview', () => {
    it('should create a review successfully', async () => {
      const user = createFakeUser();
      const product = createFakeProduct();
      const dto = { rate: 5, comment: 'Good' };
      userService.getCurrentUser.mockResolvedValue(user);
      productService.getOneBy.mockResolvedValue(product);
      repository.create.mockReturnValue(dto);
      repository.save.mockResolvedValue({ ...dto, id: 1, user, product });

      const result = await service.createNewReview(1, 1, dto);
      expect(result).toHaveProperty('id');
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update review if author', async () => {
      const review = createFakeReview({ user: { id: 1 } as any });
      repository.findOne.mockResolvedValue(review);
      repository.save.mockResolvedValue({ ...review, rate: 4 });

      const result = await service.update(1, 1, { rate: 4 });
      expect(result.rate).toBe(4);
    });

    it('should throw ForbiddenException if not author', async () => {
      const review = createFakeReview({ user: { id: 2 } as any });
      repository.findOne.mockResolvedValue(review);

      await expect(service.update(1, 1, { rate: 4 })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete review if admin', async () => {
      const review = createFakeReview({ user: { id: 2 } as any });
      repository.findOne.mockResolvedValue(review);

      const result = await service.delete({ id: 1, userType: UserType.ADMIN } as any, 1);
      expect(result).toEqual({ message: 'review deleted successfully' });
      expect(repository.remove).toHaveBeenCalled();
    });
  });
});
