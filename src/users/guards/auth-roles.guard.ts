import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JWTPayload } from 'src/utils/types';
import { Reflector } from '@nestjs/core';
import { UserType } from 'src/utils/enums';
import { UserService } from '../users.service';
@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<UserType[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length < 1) return false;
    const request: Request = context.switchToHttp().getRequest();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (token && type === 'Bearer') {
      try {
        const payload: JWTPayload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
        const user = await this.userService.getCurrentUser(payload.id);
        if (!user) return false;
        if (roles.includes(user.userType)) {
          request['user'] = payload;
          return true;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
    return false;
  }
}
