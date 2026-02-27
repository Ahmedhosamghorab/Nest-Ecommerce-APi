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
import bcrypt from 'node_modules/bcryptjs';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { AccessToken, JWTPayload } from 'src/utils/types';
import type { Response } from 'express';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserType } from 'src/utils/enums';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}
  /**
   * create new user
   * @param registerDto data needed to create new user
   * @returns (JWT) access token
   */
  public async register(registerDto: RegisterDto): Promise<AccessToken> {
    const { email, password, username } = registerDto;
    const userFromDb = await this.userRepository.findOne({ where: { email } });
    if (userFromDb) throw new BadRequestException('user already exist');
    const hashedPassword = await this.hashPassword(password);
    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      username,
    });
    await this.userRepository.save(newUser);
    const payload: JWTPayload = { id: newUser.id, userType: newUser.userType };
    const accessToken = await this.generateJWT(payload);
    return { accessToken };
  }
  /**
   * login user
   * @param loginDto data needed for login
   * @returns (JWT) access token
   */
  public async login(loginDto: LoginDto): Promise<AccessToken> {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('wrong credentials');
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) throw new BadRequestException('wrong credentials');
    const payload: JWTPayload = { id: user.id, userType: user.userType };
    const accessToken = await this.generateJWT(payload);
    return { accessToken };
  }
  /**
   * get current user
   * @param id needed id for get user
   * @returns current user
   */
  public async getCurrentUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }
  /**
   * get all users
   * @returns all users
   */
  public getAll(): Promise<User[]> {
    return this.userRepository.find();
  }
  /**
   * update user
   * @param id id to get the user
   * @param updateUserDto dto needed for updating user
   * @returns updated user
   */
  public async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.getCurrentUser(id);
    const { username, password } = updateUserDto;
    user.username = username ?? user.username;
    const hashedPassword = await this.hashPassword(password);
    if (password) {
      user.password = hashedPassword;
    }
    return this.userRepository.save(user);
  }

  /**
   *
   * @param id
   * @param updateUserDto
   * @returns
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
   * generate json web token
   * @param payload payload needed for generating token
   * @returns token
   */
  private generateJWT(payload: JWTPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
  /**
   * hashing user password
   * @param password user password
   * @returns hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }
}
