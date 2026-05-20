import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { User } from '../../src/users/user.entity';
import { Product } from '../../src/products/product.entity';
import { Cart } from '../../src/carts/entities/cart.entity';
import { Order } from '../../src/orders/entities/order.entity';
import { Category } from '../../src/categories/entities/category.entity';
import { Review } from '../../src/reviews/review.entity';
import { createMockRepository, MockRepository } from '../mocks/repository.mock';
import { createFakeUser } from '../fixtures/user.fixture';
import { UserType } from '../../src/utils/enums';

export interface TestContext {
  app: INestApplication;
  module: TestingModule;
  userRepository: Repository<User>;
  productRepository: Repository<Product>;
  cartRepository: Repository<Cart>;
  orderRepository: Repository<Order>;
  categoryRepository: Repository<Category>;
  reviewRepository: Repository<Review>;
  jwtService: JwtService;
  configService: ConfigService;
}

export class TestHelper {
  static async createTestingModule(
    moduleClass: any,
    providers: any[] = [],
    overrides: any[] = [],
  ): Promise<TestingModule> {
    const moduleBuilder = Test.createTestingModule({
      imports: [moduleClass],
      providers,
    });

    // Apply overrides
    overrides.forEach((override) => {
      moduleBuilder.overrideProvider(override.token).useValue(override.value);
    });

    // Mock all repositories
    const repositories = [User, Product, Cart, Order, Category, Review];

    repositories.forEach((entity) => {
      moduleBuilder
        .overrideProvider(getRepositoryToken(entity))
        .useValue(createMockRepository());
    });

    return moduleBuilder.compile();
  }

  static async createTestApp(module: TestingModule): Promise<INestApplication> {
    const app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    return app;
  }

  static generateJwtToken(
    jwtService: JwtService,
    payload: { id: number; userType: UserType },
  ): string {
    return jwtService.sign(payload);
  }

  static createAuthHeaders(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  static async cleanupApp(app: INestApplication): Promise<void> {
    if (app) {
      await app.close();
    }
  }

  static createMockConfigService(
    overrides: Record<string, any> = {},
  ): jest.Mocked<ConfigService> {
    const defaultConfig = {
      JWT_SECRET: 'test-jwt-secret',
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_USERNAME: 'test',
      DB_PASSWORD: 'test',
      DB_NAME: 'test_db',
      PAYMOB_SECRET_KEY: 'test-paymob-secret',
      PAYMOB_PUBLIC_KEY: 'test-paymob-public',
      PAYMOB_INTEGRATION_ID: '123456',
      PAYMOB_WEBHOOK_URL: 'http://localhost:3000/webhook',
      FRONTEND_URL: 'http://localhost:3001',
      MAIL_HOST: 'smtp.mailtrap.io',
      MAIL_PORT: 2525,
      MAIL_USER: 'test',
      MAIL_PASS: 'test',
      DOMAIN: 'http://localhost:3000',
      ...overrides,
    };

    return {
      get: jest.fn((key: string) => defaultConfig[key]),
      getOrThrow: jest.fn((key: string) => {
        const value = defaultConfig[key];
        if (value === undefined) {
          throw new Error(`Configuration key "${key}" not found`);
        }
        return value;
      }),
    } as jest.Mocked<ConfigService>;
  }

  static createMockJwtService(): jest.Mocked<JwtService> {
    return {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      verify: jest
        .fn()
        .mockReturnValue({ id: 1, userType: UserType.NORMAL_USER }),
      verifyAsync: jest
        .fn()
        .mockResolvedValue({ id: 1, userType: UserType.NORMAL_USER }),
      decode: jest
        .fn()
        .mockReturnValue({ id: 1, userType: UserType.NORMAL_USER }),
    } as jest.Mocked<JwtService>;
  }

  static createMockDataSource(): jest.Mocked<DataSource> {
    const mockManager: jest.Mocked<EntityManager> = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      transaction: jest.fn(),
    } as any;

    return {
      manager: mockManager,
      transaction: jest.fn((callback) => callback(mockManager)),
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: mockManager,
      }),
    } as any;
  }

  static expectValidationError(response: any, field?: string): void {
    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
    if (field) {
      expect(response.body.message).toContain(field);
    }
  }

  static expectUnauthorized(response: any): void {
    expect(response.status).toBe(401);
  }

  static expectForbidden(response: any): void {
    expect(response.status).toBe(403);
  }

  static expectNotFound(response: any): void {
    expect(response.status).toBe(404);
  }

  static expectConflict(response: any): void {
    expect(response.status).toBe(409);
  }

  static expectInternalServerError(response: any): void {
    expect(response.status).toBe(500);
  }
}

export const createTestUser = (overrides: Partial<User> = {}): User => {
  return createFakeUser(overrides);
};

export const createTestAdmin = (overrides: Partial<User> = {}): User => {
  return createFakeUser({
    id: 2,
    username: 'admin',
    email: 'admin@example.com',
    userType: UserType.ADMIN,
    isAccountVerified: true,
    ...overrides,
  });
};
