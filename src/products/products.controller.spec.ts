import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductService } from './products.service';
import { AuthRolesGuard } from 'src/auth/guards/auth-roles.guard';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { createFakeProduct } from '../../test/fixtures/product.fixture';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { JWTPayload } from 'src/utils/types';
import { createMockMulterFile } from '../../test/mocks/services.mock';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductService;

  const mockUser: JWTPayload = {
    id: 1,
    userType: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            createNewProduct: jest.fn(),
            getAll: jest.fn(),
            getOneBy: jest.fn(),
            update: jest.fn(),
            addProductImage: jest.fn(),
            delete: jest.fn(),
            deleteProductImage: jest.fn(),
            deleteProductImages: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthRolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createNewProduct', () => {
    it('should create a new product', async () => {
      const dto = {
        title: 'New Product',
        description: 'Description',
        price: 100,
        quantity: 10,
        categoryId: 1,
      };
      const product = createFakeProduct(dto);
      (service.createNewProduct as jest.Mock).mockResolvedValue(product);

      const result = await controller.createNewProduct(dto, mockUser);
      expect(result).toEqual(product);
      expect(service.createNewProduct).toHaveBeenCalledWith(dto, mockUser.id);
    });
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      const products = [createFakeProduct(), createFakeProduct()];
      (service.getAll as jest.Mock).mockResolvedValue(products);

      const result = await controller.getAllProducts();
      expect(result).toEqual(products);
      expect(service.getAll).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should filter products by title', async () => {
      const products = [createFakeProduct({ title: 'Laptop' })];
      (service.getAll as jest.Mock).mockResolvedValue(products);

      await controller.getAllProducts('Laptop');
      expect(service.getAll).toHaveBeenCalledWith(
        'Laptop',
        undefined,
        undefined,
        undefined,
      );
    });

    it('should filter products by price range', async () => {
      const products = [createFakeProduct({ price: 150 })];
      (service.getAll as jest.Mock).mockResolvedValue(products);

      await controller.getAllProducts(undefined, '100', '200');
      expect(service.getAll).toHaveBeenCalledWith(
        undefined,
        '100',
        '200',
        undefined,
      );
    });

    it('should filter products by category', async () => {
      const products = [createFakeProduct()];
      (service.getAll as jest.Mock).mockResolvedValue(products);

      await controller.getAllProducts(undefined, undefined, undefined, '1');
      expect(service.getAll).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        1,
      );
    });
  });

  describe('getSingleProduct', () => {
    it('should return a single product', async () => {
      const product = createFakeProduct();
      (service.getOneBy as jest.Mock).mockResolvedValue(product);

      const result = await controller.getSingleProduct(1);
      expect(result).toEqual(product);
      expect(service.getOneBy).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if not found', async () => {
      (service.getOneBy as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.getSingleProduct(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const dto = { title: 'Updated Product', price: 150 };
      const product = createFakeProduct(dto);
      (service.update as jest.Mock).mockResolvedValue(product);

      const result = await controller.updateProduct(1, dto);
      expect(result).toEqual(product);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });

    it('should throw NotFoundException if not found', async () => {
      const dto = { title: 'Updated' };
      (service.update as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(controller.updateProduct(999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('uploadProfileImage', () => {
    it('should upload product images', async () => {
      const files = [createMockMulterFile(), createMockMulterFile()];
      const responses = [
        { message: 'Image uploaded successfully' },
        { message: 'Image uploaded successfully' },
      ];
      (service.addProductImage as jest.Mock).mockResolvedValue(responses[0]);

      const result = await controller.uploadProfileImage(files, 1);
      expect(result).toHaveLength(2);
      expect(service.addProductImage).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if no files provided', async () => {
      await expect(controller.uploadProfileImage([], 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const response = { message: 'Product deleted successfully' };
      (service.delete as jest.Mock).mockResolvedValue(response);

      const result = await controller.deleteProduct(1);
      expect(result).toEqual(response);
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if not found', async () => {
      (service.delete as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(controller.deleteProduct(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteProductImage', () => {
    it('should delete a product image', async () => {
      const response = { message: 'Image deleted successfully' };
      (service.deleteProductImage as jest.Mock).mockResolvedValue(response);

      const result = await controller.deleteProductImage('image.jpg');
      expect(result).toEqual(response);
      expect(service.deleteProductImage).toHaveBeenCalledWith('image.jpg');
    });
  });

  describe('deleteAllProductImages', () => {
    it('should delete all product images', async () => {
      const response = { message: 'All images deleted successfully' };
      (service.deleteProductImages as jest.Mock).mockResolvedValue(response);

      const result = await controller.deleteAllProductImages(1);
      expect(result).toEqual(response);
      expect(service.deleteProductImages).toHaveBeenCalledWith(1);
    });
  });
});
