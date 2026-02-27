import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { UserService } from './users.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import type { Request } from 'express';
import { AuthGuard } from './guards/auth.guard';
import { JWTPayload } from 'src/utils/types';
import { Roles } from './decorators/user-role.decorator';
import { UserType } from 'src/utils/enums';
import { AuthRolesGuard } from './guards/auth-roles.guard';
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}
  // Post: ~/api/users/auth/register
  @Post('auth/register')
  public register(@Body() dto: RegisterDto) {
    return this.usersService.register(dto);
  }
  // Post: ~/api/users/auth/login
  @Post('auth/login')
  public login(@Body() dto: LoginDto) {
    return this.usersService.login(dto);
  }
  // Post: ~/api/users/profile
  @Post('profile')
  @UseGuards(AuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public getUserProfile(@Req() request: Request) {
    const payload = request['user'] as JWTPayload;
    return this.usersService.getCurrentUser(payload.id);
  }
  // Get: ~/api/users
  @Get()
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public getAllUsers() {
    return this.usersService.getAll();
  }
  // Get: ~/api/users/:id
  @Get(':id')
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  @UseGuards(AuthRolesGuard)
  public deleteUser(@Param('id') id: number, @Req() request: Request) {
    const payload = request['user'] as JWTPayload;
    return this.usersService.delete(id, payload);
  }
}
