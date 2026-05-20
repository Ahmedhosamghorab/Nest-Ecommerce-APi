import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { createMockUserService } from '../../test/mocks/user.service.mock';
import { createFakeUser } from '../../test/fixtures/user.fixture';
import { JWTPayload } from '../utils/types';
import { UserType } from '../utils/enums';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthRolesGuard } from '../auth/guards/auth-roles.guard';
import { ExecutionContext } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UserService,
          useValue: createMockUserService(),
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should return the current user profile', async () => {
      const user = createFakeUser();
      const payload: JWTPayload = { id: 1, userType: UserType.NORMAL_USER, username: 'test' };
      service.getCurrentUser.mockResolvedValue(user);

      const result = await controller.getUserProfile(payload);
      expect(result).toEqual(user);
      expect(service.getCurrentUser).toHaveBeenCalledWith(1);
    });
  });

  describe('register', () => {
    it('should call service.register', async () => {
      const dto = { username: 'test', email: 'test@test.com', password: 'password' };
      service.register.mockResolvedValue({ message: 'success' });

      const result = await controller.register(dto as any);
      expect(result).toEqual({ message: 'success' });
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [createFakeUser()];
      service.getAll.mockResolvedValue(users);

      const result = await controller.getAllUsers();
      expect(result).toEqual(users);
      expect(service.getAll).toHaveBeenCalled();
    });
  });
});
