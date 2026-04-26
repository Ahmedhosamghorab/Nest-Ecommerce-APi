import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  BadRequestException,
  UploadedFile,
  Delete,
  Res,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
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
  // POST: ~/api/users/upload-image
  @Post('upload-image')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('user-image', {
      storage: diskStorage({
        destination: 'images/users',
        filename: (req, file, cb) => {
          const prefix = `${Date.now()}-${Math.round(Math.random() * 10000)}`;
          const filename = `${prefix}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image')) {
          return cb(null, true);
        }
        return cb(new BadRequestException('unsupported file format'), false);
      },
      limits: { fileSize: 1024 * 1024 * 2 },
    }),
  )
  public uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() payload: JWTPayload,
  ) {
    if (!file) throw new BadRequestException('no file provided');
    return this.usersService.setProfileImage(payload.id, file.filename);
  }
  //DELETE: ~/api/users/images/remove-profile-image
  @Delete('images/remove-profile-image')
  public deleteProfileImage(@CurrentUser() payload: JWTPayload) {
    return this.usersService.deleteProfileImage(payload.id);
  }

  //GET: ~/api/users/images/:image
  @Delete('images/:image')
  @UseGuards(AuthGuard)
  public showProfileImage(@Param('image') image: string, @Res() res: Response) {
    return res.sendFile(image, { root: 'images/users' });
  }
}
