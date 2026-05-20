import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { AuthRolesGuard } from 'src/auth/guards/auth-roles.guard';
import { createFakeCategory } from '../../test/fixtures/category.fixture';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            create: jest.fn(),
            getAll: jest.fn(),
            getOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthRolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto = { name: 'New Category' };
      const category = createFakeCategory({ name: 'New Category' });
      (service.create as jest.Mock).mockResolvedValue(category);

      const result = await controller.create(dto);
      expect(result).toEqual(category);
      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException if name exists', async () => {
      const dto = { name: 'Existing' };
      (service.create as jest.Mock).mockRejectedValue(new ConflictException());

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getAll', () => {
    it('should return all categories', async () => {
      const categories = [createFakeCategory(), createFakeCategory()];
      (service.getAll as jest.Mock).mockResolvedValue(categories);

      const result = await controller.getAll('1', '10', undefined);
      expect(result).toEqual(categories);
      expect(service.getAll).toHaveBeenCalledWith(1, 10, undefined);
    });

    it('should handle pagination parameters', async () => {
      const categories = [createFakeCategory()];
      (service.getAll as jest.Mock).mockResolvedValue(categories);

      await controller.getAll('2', '5', 'search');
      expect(service.getAll).toHaveBeenCalledWith(2, 5, 'search');
    });
  });

  describe('getOne', () => {
    it('should return a single category', async () => {
      const category = createFakeCategory();
      (service.getOne as jest.Mock).mockResolvedValue(category);

      const result = await controller.getOne(1);
      expect(result).toEqual(category);
      expect(service.getOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if not found', async () => {
      (service.getOne as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(controller.getOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const dto = { name: 'Updated' };
      const category = createFakeCategory({ name: 'Updated' });
      (service.update as jest.Mock).mockResolvedValue(category);

      const result = await controller.update(1, dto);
      expect(result).toEqual(category);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });

    it('should throw NotFoundException if not found', async () => {
      const dto = { name: 'Updated' };
      (service.update as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(controller.update(999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      const response = { message: 'Category deleted successfully' };
      (service.delete as jest.Mock).mockResolvedValue(response);

      const result = await controller.delete(1);
      expect(result).toEqual(response);
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if not found', async () => {
      (service.delete as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(controller.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
