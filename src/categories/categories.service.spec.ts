import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { createMockRepository, MockRepository } from '../../test/mocks/repository.mock';
import { createFakeCategory } from '../../test/fixtures/category.fixture';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: MockRepository<Category>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: createMockRepository<Category>(),
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category successfully', async () => {
      const dto = { name: 'New Category' };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(dto);
      repository.save.mockResolvedValue({ ...dto, id: 1 });

      const result = await service.create(dto);
      expect(result).toHaveProperty('id');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if name exists', async () => {
      repository.findOne.mockResolvedValue(createFakeCategory());
      await expect(service.create({ name: 'Exists' })).rejects.toThrow(ConflictException);
    });
  });

  describe('getOne', () => {
    it('should return a category if found', async () => {
      const category = createFakeCategory();
      repository.findOne.mockResolvedValue(category);

      const result = await service.getOne(1);
      expect(result).toEqual(category);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.getOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      const category = createFakeCategory();
      repository.findOne.mockResolvedValue(category);

      const result = await service.delete(1);
      expect(result).toEqual({ message: 'Category deleted successfully' });
      expect(repository.remove).toHaveBeenCalledWith(category);
    });
  });
});
