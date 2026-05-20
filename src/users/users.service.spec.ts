import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { createMockRepository, MockRepository } from '../../test/mocks/repository.mock';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from '../auth/auth.service';
import { createMockAuthService } from '../../test/mocks/auth.service.mock';
import { createFakeUser, createFakeAdmin } from '../../test/fixtures/user.fixture';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserType } from '../utils/enums';

describe('UserService', () => {
  let service: UserService;
  let userRepository: MockRepository<User>;
  let authService: any;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository<User>(),
        },
        {
          provide: AuthService,
          useValue: createMockAuthService(),
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    authService = module.get(AuthService);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return a user if found', async () => {
      const user = createFakeUser();
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.getCurrentUser(1);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getCurrentUser(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const user = createFakeUser();
      const updateDto = { username: 'newname' };
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({ ...user, ...updateDto });

      const result = await service.update(1, updateDto);
      expect(result.username).toBe('newname');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should hash password if provided', async () => {
      const user = createFakeUser();
      const updateDto = { password: 'newpassword' };
      userRepository.findOne.mockResolvedValue(user);
      authService.hashPassword.mockResolvedValue('hashed_new_password');
      userRepository.save.mockResolvedValue({ ...user, password: 'hashed_new_password' });

      await service.update(1, updateDto);
      expect(authService.hashPassword).toHaveBeenCalledWith('newpassword');
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete user if it is the same user', async () => {
      const user = createFakeUser({ id: 1 });
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.delete(1, { id: 1, userType: UserType.NORMAL_USER } as any);
      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(userRepository.remove).toHaveBeenCalledWith(user);
    });

    it('should delete user if requester is admin', async () => {
      const user = createFakeUser({ id: 1 });
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.delete(1, { id: 2, userType: UserType.ADMIN } as any);
      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(userRepository.remove).toHaveBeenCalledWith(user);
    });

    it('should throw ForbiddenException if not authorized', async () => {
      const user = createFakeUser({ id: 1 });
      userRepository.findOne.mockResolvedValue(user);

      await expect(service.delete(1, { id: 2, userType: UserType.NORMAL_USER } as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const user = createFakeUser({ id: 1, verificationToken: 'token', isAccountVerified: false });
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.verifyEmail(1, 'token');
      expect(result).toEqual({ message: 'account verified successfully' });
      expect(user.isAccountVerified).toBe(true);
      expect(user.verificationToken).toBeNull();
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.verified', expect.any(Object));
    });

    it('should throw BadRequestException if token is invalid', async () => {
      const user = createFakeUser({ id: 1, verificationToken: 'token' });
      userRepository.findOne.mockResolvedValue(user);

      await expect(service.verifyEmail(1, 'wrong_token')).rejects.toThrow(BadRequestException);
    });
  });
});
