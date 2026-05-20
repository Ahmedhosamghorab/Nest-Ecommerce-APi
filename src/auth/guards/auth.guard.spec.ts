import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { UserType } from '../../utils/enums';
import { TestHelper } from '../../../test/utils/test-utils';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: TestHelper.createMockJwtService(),
        },
        {
          provide: ConfigService,
          useValue: TestHelper.createMockConfigService(),
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
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
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return true for valid Bearer token', async () => {
      // Arrange
      const mockPayload = { id: 1, userType: UserType.NORMAL_USER };
      const context = createMockExecutionContext('Bearer valid-token');
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(mockPayload);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-jwt-secret',
      });
      expect(context.switchToHttp().getRequest().user).toEqual(mockPayload);
    });

    it('should return false for invalid token', async () => {
      // Arrange
      const context = createMockExecutionContext('Bearer invalid-token');
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('Invalid token'),
      );

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-token', {
        secret: 'test-jwt-secret',
      });
      expect(context.switchToHttp().getRequest().user).toBeUndefined();
    });

    it('should return false for missing authorization header', async () => {
      // Arrange
      const context = createMockExecutionContext();

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should return false for malformed authorization header', async () => {
      // Arrange
      const context = createMockExecutionContext('InvalidFormat token');

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should return false for missing token', async () => {
      // Arrange
      const context = createMockExecutionContext('Bearer ');

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should return false for Bearer without token', async () => {
      // Arrange
      const context = createMockExecutionContext('Bearer');

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should handle JWT verification errors gracefully', async () => {
      // Arrange
      const context = createMockExecutionContext('Bearer expired-token');
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('Token expired'),
      );

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(context.switchToHttp().getRequest().user).toBeUndefined();
    });

    it('should work with admin user token', async () => {
      // Arrange
      const mockPayload = { id: 2, userType: UserType.ADMIN };
      const context = createMockExecutionContext('Bearer admin-token');
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(mockPayload);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(context.switchToHttp().getRequest().user).toEqual(mockPayload);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined authorization header', async () => {
      // Arrange
      const mockRequest = { headers: {} };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle null authorization header', async () => {
      // Arrange
      const mockRequest = { headers: { authorization: null } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });
  });
});
