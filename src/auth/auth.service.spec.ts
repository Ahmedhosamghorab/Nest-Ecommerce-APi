import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { User } from '../users/user.entity';
import { BadRequestException } from '@nestjs/common';
import { UserType } from '../utils/enums';
import { createMockRepository } from '../../test/mocks/repository.mock';
import { createFakeUser } from '../../test/fixtures/user.fixture';
import { createMockMailService } from '../../test/mocks/services.mock';
import { TestHelper } from '../../test/utils/test-utils';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: JwtService;
  let configService: ConfigService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: JwtService,
          useValue: TestHelper.createMockJwtService(),
        },
        {
          provide: ConfigService,
          useValue: TestHelper.createMockConfigService(),
        },
        {
          provide: MailService,
          useValue: createMockMailService(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    mailService = module.get<MailService>(MailService);

    // Setup bcrypt mocks
    mockedBcrypt.genSalt.mockResolvedValue('salt' as any);
    mockedBcrypt.hash.mockResolvedValue('hashedPassword');
    mockedBcrypt.compare.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      const newUser = createFakeUser({
        email: registerDto.email,
        username: registerDto.username,
        verificationToken: 'mock-token',
      });
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: 'hashedPassword',
        username: registerDto.username,
        verificationToken: expect.any(String),
      });
      expect(userRepository.save).toHaveBeenCalledWith(newUser);
      expect(mailService.sendVerifyEmail).toHaveBeenCalledWith(
        registerDto.email,
        expect.stringContaining('/api/users/verify-email/'),
      );
      expect(result).toEqual({
        message: 'verification link has been sent to your email',
      });
    });

    it('should throw BadRequestException if user already exists', async () => {
      // Arrange
      const existingUser = createFakeUser({ email: registerDto.email });
      userRepository.findOne.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        new BadRequestException('user already exist'),
      );
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(mailService.sendVerifyEmail).not.toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      const newUser = createFakeUser();
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);

      // Act
      await service.register(registerDto);

      // Assert
      expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        registerDto.password,
        'salt',
      );
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashedPassword',
        }),
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with verified user', async () => {
      // Arrange
      const user = createFakeUser({
        email: loginDto.email,
        isAccountVerified: true,
        userType: UserType.NORMAL_USER,
      });
      userRepository.findOne.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        id: user.id,
        userType: user.userType,
      });
      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
    });

    it('should send verification email for unverified user', async () => {
      // Arrange
      const user = createFakeUser({
        email: loginDto.email,
        isAccountVerified: false,
        verificationToken: 'existing-token',
      });
      userRepository.findOne.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(mailService.sendVerifyEmail).toHaveBeenCalledWith(
        user.email,
        expect.stringContaining('/api/users/verify-email/'),
      );
      expect(result).toEqual({
        message: 'verification link has been sent to your email',
      });
    });

    it('should generate new verification token if none exists', async () => {
      // Arrange
      const user = createFakeUser({
        email: loginDto.email,
        isAccountVerified: false,
        verificationToken: null,
      });
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({
        ...user,
        verificationToken: 'new-token',
      });
      mockedBcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationToken: expect.any(String),
        }),
      );
      expect(result).toEqual({
        message: 'verification link has been sent to your email',
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new BadRequestException('wrong credentials'),
      );
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password is incorrect', async () => {
      // Arrange
      const user = createFakeUser({ email: loginDto.email });
      userRepository.findOne.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new BadRequestException('wrong credentials'),
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('hashPassword', () => {
    it('should hash password with salt', async () => {
      // Arrange
      const password = 'testPassword123';
      mockedBcrypt.genSalt.mockResolvedValue('test-salt' as any);
      mockedBcrypt.hash.mockResolvedValue('hashed-password');

      // Act
      const result = await service.hashPassword(password);

      // Assert
      expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 'test-salt');
      expect(result).toBe('hashed-password');
    });
  });

  describe('error scenarios', () => {
    it('should handle database errors during registration', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle mail service errors during registration', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };
      userRepository.findOne.mockResolvedValue(null);
      const newUser = createFakeUser();
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);
      (mailService.sendVerifyEmail as jest.Mock).mockRejectedValue(
        new Error('Mail error'),
      );

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow('Mail error');
    });

    it('should handle JWT signing errors during login', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = createFakeUser({
        email: loginDto.email,
        isAccountVerified: true,
      });
      userRepository.findOne.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock).mockRejectedValue(
        new Error('JWT error'),
      );

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('JWT error');
    });
  });
});
