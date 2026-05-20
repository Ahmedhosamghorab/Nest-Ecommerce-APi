import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthRolesGuard } from './auth-roles.guard';
import { UserService } from '../../users/users.service';
import { UserType } from '../../utils/enums';
import {
  TestHelper,
  createTestUser,
  createTestAdmin,
} from '../../../test/utils/test-utils';

describe('AuthRolesGuard', () => {
  let guard: AuthRolesGuard;
  let jwtService: JwtService;
  let configService: ConfigService;
  let reflector: Reflector;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRolesGuard,
        {
          provide: JwtService,
          useValue: TestHelper.createMockJwtService(),
        },
        {
          provide: ConfigService,
          useValue: TestHelper.createMockConfigService(),
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            getCurrentUser: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthRolesGuard>(AuthRolesGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    reflector = module.get<Reflector>(Reflector);
    userService = module.get<UserService>(UserService);
  });

  const createMockExecutionContext = (
    authHeader?: string,
  ): ExecutionContext => {
    const mockRequest = {
      headers: {
        authorization: authHeader,
      },
      user: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should return true for admin user with admin role requirement', async () => {
      // Arrange
      const adminUser = createTestAdmin();
      const context = createMockExecutionContext('Bearer admin-token');

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserType.ADMIN,
      ]);
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        id: adminUser.id,
        userType: UserType.ADMIN,
      });
      (userService.getCurrentUser as jest.Mock).mockResolvedValue(adminUser);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('admin-token', {
        secret: 'test-jwt-secret',
      });
      expect(userService.getCurrentUser).toHaveBeenCalledWith(adminUser.id);
      expect(context.switchToHttp().getRequest().user).toEqual(adminUser);
    });

    it('should return true for normal user with normal user role requirement', async () => {
      // Arrange
      const normalUser = createTestUser();
      const context = createMockExecutionContext('Bearer user-token');

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserType.NORMAL_USER,
      ]);
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        id: normalUser.id,
        userType: UserType.NORMAL_USER,
      });
      (userService.getCurrentUser as jest.Mock).mockResolvedValue(normalUser);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(context.switchToHttp().getRequest().user).toEqual(normalUser);
    });

    it('should return false for normal user trying to access admin-only resource', async () => {
      // Arrange
      const normalUser = createTestUser();
      const context = createMockExecutionContext('Bearer user-token');

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserType.ADMIN,
      ]);
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        id: normalUser.id,
        userType: UserType.NORMAL_USER,
      });
      (userService.getCurrentUser as jest.Mock).mockResolvedValue(normalUser);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(context.switchToHttp().getRequest().user).toBeUndefined();
    });

    it('should return false when no roles are defined', async () => {
      // Arrange
      const context = createMockExecutionContext('Bearer valid-token');
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should return false when no authorization header is provided', async () => {
      // Arrange
      const context = createMockExecutionContext();
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserType.ADMIN,
      ]);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should return false when JWT verification fails', async () => {
      // Arrange
      const context = createMockExecutionContext('Bearer invalid-token');
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserType.ADMIN,
      ]);
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('Invalid token'),
      );

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(userService.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should return false when user is not found', async () => {
      // Arrange
      const context = createMockExecutionContext('Bearer valid-token');
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserType.ADMIN,
      ]);
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        id: 999,
        userType: UserType.ADMIN,
      });
      (userService.getCurrentUser as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(userService.getCurrentUser).toHaveBeenCalledWith(999);
    });
  });
});
