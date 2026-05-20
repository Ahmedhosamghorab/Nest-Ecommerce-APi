import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import type { AccessToken, JWTPayload, MessageResponse } from 'src/utils/types';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserType } from 'src/utils/enums';
import { AuthService } from 'src/auth/auth.service';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserVerifiedEvent } from './events/user-verified.event';

/**
 * Service responsible for managing users, including registration, login, and profile updates.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  /**
   * Registers a new user in the system.
   * @param registerDto - The data required for user registration (username, password, etc.).
   * @returns A promise that resolves to a message response.
   */
  public async register(registerDto: RegisterDto): Promise<MessageResponse> {
    return this.authService.register(registerDto);
  }

  /**
   * Authenticates a user and provides an access token.
   * @param loginDto - The credentials required for login (username, password).
   * @returns A promise that resolves to an access token (JWT) or message response.
   */
  public async login(
    loginDto: LoginDto,
  ): Promise<AccessToken | MessageResponse> {
    return this.authService.login(loginDto);
  }

  /**
   * Retrieves the current user's profile based on their ID.
   * @param id - The unique identifier of the user.
   * @returns A promise that resolves to the user entity.
   * @throws NotFoundException if the user does not exist.
   */
  public async getCurrentUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  /**
   * Retrieves a list of all users registered in the system.
   * @returns A promise that resolves to an array of User entities.
   */
  public getAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * Updates an existing user's profile.
   * @param id - The ID of the user to update.
   * @param updateUserDto - The data to update (e.g., username, password).
   * @returns A promise that resolves to the updated User entity.
   */
  public async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.getCurrentUser(id);
    const { username, password } = updateUserDto;
    user.username = username ?? user.username;
    if (password) {
      const hashedPassword = await this.authService.hashPassword(password);
      user.password = hashedPassword;
    }
    return this.userRepository.save(user);
  }

  /**
   * Deletes a user account.
   * @param id - The ID of the user to delete.
   * @param payload - The JWT payload of the requester to verify permissions.
   * @returns A promise that resolves to a success message.
   * @throws ForbiddenException if the requester does not have permission to delete the account.
   */
  public async delete(
    id: number,
    payload: JWTPayload,
  ): Promise<MessageResponse> {
    const user = await this.getCurrentUser(id);
    if (user.id === payload.id || payload.userType === UserType.ADMIN) {
      await this.userRepository.remove(user);
      return { message: 'User deleted successfully' };
    }
    throw new ForbiddenException('Access denied');
  }

  /**
   * Sets or updates the user's profile image.
   * @param userId - The ID of the user.
   * @param newProfileImage - The filename of the new profile image.
   * @returns A promise that resolves to the updated User entity.
   */
  public async setProfileImage(
    userId: number,
    newProfileImage: string,
  ): Promise<User> {
    const user = await this.getCurrentUser(userId);
    if (user.profileImage !== null) {
      await this.deleteProfileImage(userId);
    }
    user.profileImage = newProfileImage;
    return this.userRepository.save(user);
  }

  /**
   * Deletes the user's current profile image from the filesystem and database.
   * @param userId - The ID of the user whose profile image should be deleted.
   * @returns A promise that resolves to the updated User entity with profileImage set to null.
   * @throws BadRequestException if the user has no profile image to delete.
   */
  public async deleteProfileImage(userId: number): Promise<User> {
    const user = await this.getCurrentUser(userId);
    if (user.profileImage === null)
      throw new BadRequestException('no profile image found');
    const imageFilePath = join(
      process.cwd(),
      `./images/users/${user.profileImage}`,
    );
    try {
      unlinkSync(imageFilePath);
    } catch (error) {
      // Log error but continue to clear DB record if file is missing
      console.error(
        `Failed to delete profile image file: ${imageFilePath}`,
        error,
      );
    }
    user.profileImage = null;
    return this.userRepository.save(user);
  }

  /**
   * Verifies a user's email address using a verification token.
   * @param userId - The ID of the user to verify.
   * @param verificationToken - The token sent to the user's email.
   * @returns A promise that resolves to a success message.
   * @throws NotFoundException if no token is found for the user.
   * @throws BadRequestException if the provided token is invalid.
   */
  public async verifyEmail(
    userId: number,
    verificationToken: string,
  ): Promise<MessageResponse> {
    const user = await this.getCurrentUser(userId);
    if (user.verificationToken === null)
      throw new NotFoundException('no token found');
    if (user.verificationToken !== verificationToken)
      throw new BadRequestException('invalid link');
    user.isAccountVerified = true;
    user.verificationToken = null;
    await this.userRepository.save(user);
    this.eventEmitter.emit('user.verified', new UserVerifiedEvent(user.id));
    return { message: 'account verified successfully' };
  }
}
