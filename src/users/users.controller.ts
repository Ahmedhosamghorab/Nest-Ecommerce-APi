import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { UserService } from './users.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthGuard } from './guards/auth.guard';
import type { JWTPayload } from 'src/utils/types';
import { Roles } from './decorators/user-role.decorator';
import { UserType } from 'src/utils/enums';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
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
  public getUserProfile(@CurrentUser() payload: JWTPayload) {
    return this.usersService.getCurrentUser(payload.id);
  }
  // Get: ~/api/users
  @Get()
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  public getAllUsers() {
    return this.usersService.getAll();
  }
  // Get: ~/api/users/:id
  @Get(':id')
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  @UseGuards(AuthRolesGuard)
  public deleteUser(
    @Param('id') id: number,
    @CurrentUser() payload: JWTPayload,
  ) {
    return this.usersService.delete(id, payload);
  }
}
