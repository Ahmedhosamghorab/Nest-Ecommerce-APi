import { Category } from '../../src/categories/entities/category.entity';

export const createFakeCategory = (overrides: Partial<Category> = {}): Category => {
  const category = new Category();
  category.id = 1;
  category.name = 'Electronics';
  category.products = [];

  return { ...category, ...overrides } as Category;
};
