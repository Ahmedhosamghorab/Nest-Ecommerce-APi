import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dtos/register.dto';
import bcrypt from 'node_modules/bcryptjs';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { AccessToken, JWTPayload } from 'src/utils/types';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class AuthService {
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
   * hashing user password
   * @param password user password
   * @returns hashed password
   */
  public async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }
  /**
   * generate json web token
   * @param payload payload needed for generating token
   * @returns token
   */
  private generateJWT(payload: JWTPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
