import { Product } from '../../src/products/product.entity';
import { Category } from '../../src/categories/entities/category.entity';
import { createFakeUser } from './user.fixture';

export const createFakeProduct = (
  overrides: Partial<Product> = {},
): Product => {
  const product = new Product();
  product.id = 1;
  product.title = 'Test Product';
  product.description = 'Test Description';
  product.price = 100;
  product.quantity = 10;
  product.created_at = new Date();
  product.updated_at = new Date();
  product.images = [];
  product.reviews = [];
  product.orderItems = [];
  product.category = null;
  product.user = createFakeUser();

  return { ...product, ...overrides } as Product;
};

export const createFakeProductWithCategory = (
  overrides: Partial<Product> = {},
): Product => {
  const category = new Category();
  category.id = 1;
  category.name = 'Electronics';
  category.description = 'Electronic products';
  category.created_at = new Date();
  category.updated_at = new Date();

  return createFakeProduct({
    category,
    ...overrides,
  });
};

export const createFakeProductList = (count: number = 3): Product[] => {
  return Array.from({ length: count }, (_, index) =>
    createFakeProduct({
      id: index + 1,
      title: `Test Product ${index + 1}`,
      price: 100 + index * 10,
    }),
  );
};
