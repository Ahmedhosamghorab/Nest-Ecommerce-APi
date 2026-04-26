import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dtos/register.dto';
import bcrypt from 'node_modules/bcryptjs';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JWTPayload } from 'src/utils/types';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
@Injectable()
export class AuthProvider {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}
  /**
   * create new user
   * @param registerDto data needed to create new user
   * @returns (JWT) access token
   */
  public async register(registerDto: RegisterDto) {
    const { email, password, username } = registerDto;
    const userFromDb = await this.userRepository.findOne({ where: { email } });
    if (userFromDb) throw new BadRequestException('user already exist');
    const hashedPassword = await this.hashPassword(password);
    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      username,
      verificationToken: randomBytes(32).toString('hex'),
    });
    await this.userRepository.save(newUser);
    const link = this.generateLink(newUser.id, newUser.verificationToken);
    await this.mailService.sendVerifyEmail(newUser.email, link);
    return { message: 'verification link has been sent to your email' };
  }
  /**
   * login user
   * @param loginDto data needed for login
   * @returns (JWT) access token
   */
  public async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('wrong credentials');
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) throw new BadRequestException('wrong credentials');
    if (!user.isAccountVerified) {
      let verificationToken = user.verificationToken;
      if (!verificationToken) {
        user.verificationToken = randomBytes(32).toString('hex');
        const result = await this.userRepository.save(user);
        verificationToken = result.verificationToken;
      }
      const link = this.generateLink(user.id, verificationToken);
      await this.mailService.sendVerifyEmail(user.email, link);
      return { message: 'verification link has been sent to your email' };
    }
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
  private generateLink(userId: number, verificationToken: string | null) {
    return `${this.config.get<string>('DOMAIN')}/api/users/verify-email/${userId}/${verificationToken}`;
  }
}
