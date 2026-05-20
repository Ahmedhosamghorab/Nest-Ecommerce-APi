import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewService } from './reviews.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AuthRolesGuard } from 'src/auth/guards/auth-roles.guard';
import { createFakeReview } from '../../test/fixtures/review.fixture';
import { NotFoundException } from '@nestjs/common';
import type { JWTPayload } from 'src/utils/types';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let service: ReviewService;

  const mockUser: JWTPayload = {
    id: 1,
    userType: 'NORMAL_USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewService,
          useValue: {
            createNewReview: jest.fn(),
            getAll: jest.fn(),
            getOneBy: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AuthRolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ReviewsController>(ReviewsController);
    service = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createNewReview', () => {
    it('should create a new review', async () => {
      const dto = {
        rating: 5,
        comment: 'Great product!',
      };
      const review = createFakeReview(dto);
      (service.createNewReview as jest.Mock).mockResolvedValue(review);

      const result = await controller.createNewReview(1, mockUser, dto);
      expect(result).toEqual(review);
      expect(service.createNewReview).toHaveBeenCalledWith(1, mockUser.id, dto);
    });
  });

  describe('getAllReviews', () => {
    it('should return all reviews with pagination', async () => {
      const reviews = [createFakeReview(), createFakeReview()];
      (service.getAll as jest.Mock).mockResolvedValue(reviews);

      const result = await controller.getAllReviews(1, 10);
      expect(result).toEqual(reviews);
      expect(service.getAll).toHaveBeenCalledWith(1, 10);
    });

    it('should handle different pagination parameters', async () => {
      const reviews = [createFakeReview()];
      (service.getAll as jest.Mock).mockResolvedValue(reviews);

      await controller.getAllReviews(2, 5);
      expect(service.getAll).toHaveBeenCalledWith(2, 5);
    });
  });

  describe('getSingleReview', () => {
    it('should return a single review', async () => {
      const review = createFakeReview();
      (service.getOneBy as jest.Mock).mockResolvedValue(review);

      const result = await controller.getSingleReview(1);
      expect(result).toEqual(review);
      expect(service.getOneBy).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if not found', async () => {
      (service.getOneBy as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.getSingleReview(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateReview', () => {
    it('should update a review', async () => {
      const dto = { rating: 4, comment: 'Good product' };
      const review = createFakeReview(dto);
      (service.update as jest.Mock).mockResolvedValue(review);

      const result = await controller.updateReview(mockUser, 1, dto);
      expect(result).toEqual(review);
      expect(service.update).toHaveBeenCalledWith(mockUser.id, 1, dto);
    });

    it('should throw NotFoundException if not found', async () => {
      const dto = { rating: 4 };
      (service.update as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(controller.updateReview(mockUser, 999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      const response = { message: 'Review deleted successfully' };
      (service.delete as jest.Mock).mockResolvedValue(response);

      const result = await controller.deleteReview(mockUser, 1);
      expect(result).toEqual(response);
      expect(service.delete).toHaveBeenCalledWith(mockUser, 1);
    });

    it('should throw NotFoundException if not found', async () => {
      (service.delete as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(controller.deleteReview(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
