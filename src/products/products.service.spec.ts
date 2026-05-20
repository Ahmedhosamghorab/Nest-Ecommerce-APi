import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductImage } from './product_image.entity';
import { Category } from '../categories/entities/category.entity';
import { UserService } from '../users/users.service';
import { createMockRepository, MockRepository } from '../../test/mocks/repository.mock';
import { createMockUserService } from '../../test/mocks/user.service.mock';
import { createFakeProduct } from '../../test/fixtures/product.fixture';
import { createFakeUser } from '../../test/fixtures/user.fixture';
import { NotFoundException } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: MockRepository<Product>;
  let productImageRepository: MockRepository<ProductImage>;
  let categoryRepository: MockRepository<Category>;
  let userService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: createMockRepository<Product>(),
        },
        {
          provide: getRepositoryToken(ProductImage),
          useValue: createMockRepository<ProductImage>(),
        },
        {
          provide: getRepositoryToken(Category),
          useValue: createMockRepository<Category>(),
        },
        {
          provide: UserService,
          useValue: createMockUserService(),
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepository = module.get(getRepositoryToken(Product));
    productImageRepository = module.get(getRepositoryToken(ProductImage));
    categoryRepository = module.get(getRepositoryToken(Category));
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNewProduct', () => {
    it('should create a new product successfully', async () => {
      const user = createFakeUser();
      const dto = { title: 'New Product', price: 100, description: 'desc', quantity: 5 };
      userService.getCurrentUser.mockResolvedValue(user);
      productRepository.create.mockReturnValue(dto);
      productRepository.save.mockResolvedValue({ ...dto, id: 1, user });

      const result = await service.createNewProduct(dto as any, 1);
      expect(result).toHaveProperty('id');
      expect(productRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category provided but not found', async () => {
      const dto = { title: 'New Product', price: 100, description: 'desc', quantity: 5, categoryId: 99 };
      userService.getCurrentUser.mockResolvedValue(createFakeUser());
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.createNewProduct(dto as any, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOneBy', () => {
    it('should return a product if found', async () => {
      const product = createFakeProduct();
      productRepository.findOne.mockResolvedValue(product);

      const result = await service.getOneBy(1);
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.getOneBy(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update product fields', async () => {
      const product = createFakeProduct();
      const dto = { title: 'Updated Title' };
      productRepository.findOne.mockResolvedValue(product);
      productRepository.save.mockResolvedValue({ ...product, ...dto });

      const result = await service.update(1, dto as any);
      expect(result.title).toBe('Updated Title');
      expect(productRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete product successfully', async () => {
      const product = createFakeProduct();
      productRepository.findOne.mockResolvedValue(product);

      const result = await service.delete(1);
      expect(result).toEqual({ message: 'product deleted successfully' });
      expect(productRepository.remove).toHaveBeenCalledWith(product);
    });
  });
});
