import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JWTPayload } from 'src/utils/types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JWTPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('User not found in request context');
    }
    return user;
  },
);
