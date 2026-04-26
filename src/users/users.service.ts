import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JWTPayload } from 'src/utils/types';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserType } from 'src/utils/enums';
import { AuthProvider } from './auth.provider';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';
/**
 * Service responsible for managing users, including registration, login, and profile updates.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly authService: AuthProvider,
  ) {}

  /**
   * Registers a new user in the system.
   * @param registerDto - The data required for user registration (username, password, etc.).
   * @returns A promise that resolves to an access token (JWT).
   */
  public async register(registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Authenticates a user and provides an access token.
   * @param loginDto - The credentials required for login (username, password).
   * @returns A promise that resolves to an access token (JWT).
   */
  public async login(loginDto: LoginDto) {
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
  public async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.getCurrentUser(id);
    const { username, password } = updateUserDto;
    user.username = username ?? user.username;
    const hashedPassword = await this.authService.hashPassword(password);
    if (password) {
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
  public async delete(id: number, payload: JWTPayload) {
    const user = await this.getCurrentUser(id);
    if (user.id == payload.id || user.userType == UserType.ADMIN) {
      await this.userRepository.remove(user);
      return { message: 'product deleted successfully' };
    }
    throw new ForbiddenException('Access denied');
  }

  /**
   * Sets or updates the user's profile image.
   * @param userId - The ID of the user.
   * @param newProfileImage - The filename of the new profile image.
   * @returns A promise that resolves to the updated User entity.
   */
  public async setProfileImage(userId: number, newProfileImage: string) {
    const user = await this.getCurrentUser(userId);
    if (user.profileImage === null) {
      user.profileImage = newProfileImage;
    } else {
      await this.deleteProfileImage(userId);
      user.profileImage = newProfileImage;
    }
    return this.userRepository.save(user);
  }

  /**
   * Deletes the user's current profile image from the filesystem and database.
   * @param userId - The ID of the user whose profile image should be deleted.
   * @returns A promise that resolves to the updated User entity with profileImage set to null.
   * @throws BadRequestException if the user has no profile image to delete.
   */
  public async deleteProfileImage(userId: number) {
    const user = await this.getCurrentUser(userId);
    if (user.profileImage === null)
      throw new BadRequestException('no profile image founded');
    const imageFilePath = join(
      process.cwd(),
      `./images/users/${user.profileImage}`,
    );
    unlinkSync(imageFilePath);
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
  public async verifyEmail(userId: number, verificationToken: string) {
    const user = await this.getCurrentUser(userId);
    if (user.verificationToken === null)
      throw new NotFoundException('no token found');
    if (user.verificationToken !== verificationToken)
      throw new BadRequestException('invalid link');
    user.isAccountVerified = true;
    user.verificationToken = null;
    await this.userRepository.save(user);
    return { message: 'account verified successfully' };
  }
}
