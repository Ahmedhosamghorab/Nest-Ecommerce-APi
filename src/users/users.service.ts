import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AccessToken, JWTPayload } from 'src/utils/types';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserType } from 'src/utils/enums';
import { AuthProvider } from './auth.provider';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly authService: AuthProvider,
  ) {}
  /**
   * create new user
   * @param registerDto data needed to create new user
   * @returns (JWT) access token
   */
  public async register(registerDto: RegisterDto): Promise<AccessToken> {
    return this.authService.register(registerDto);
  }
  /**
   * login user
   * @param loginDto data needed for login
   * @returns (JWT) access token
   */
  public async login(loginDto: LoginDto): Promise<AccessToken> {
    return this.authService.login(loginDto);
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
    const hashedPassword = await this.authService.hashPassword(password);
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
}
