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
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './users.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AccessToken, MessageResponse } from 'src/utils/types';
import type { JWTPayload } from 'src/utils/types';
import { Roles } from './decorators/user-role.decorator';
import { UserType } from 'src/utils/enums';
import { AuthRolesGuard } from 'src/auth/guards/auth-roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { User } from './user.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered.',
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists.',
  })
  @ApiBody({ type: RegisterDto })
  @Post('auth/register')
  public register(@Body() dto: RegisterDto): Promise<MessageResponse> {
    return this.usersService.register(dto);
  }

  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in.',
    type: AccessToken,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials.',
  })
  @ApiBody({ type: LoginDto })
  @Post('auth/login')
  public login(@Body() dto: LoginDto): Promise<AccessToken | MessageResponse> {
    return this.usersService.login(dto);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully.',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @Get('profile')
  @UseGuards(AuthGuard)
  public getUserProfile(@CurrentUser() payload: JWTPayload): Promise<User> {
    return this.usersService.getCurrentUser(payload.id);
  }

  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully.',
    type: [User],
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @Get()
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  public getAllUsers(): Promise<User[]> {
    return this.usersService.getAll();
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully.',
    type: MessageResponse,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @Delete(':id')
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  @UseGuards(AuthRolesGuard)
  public deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() payload: JWTPayload,
  ): Promise<MessageResponse> {
    return this.usersService.delete(id, payload);
  }

  @ApiOperation({ summary: 'Upload profile image' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        'user-image': {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image uploaded successfully.',
    type: User,
  })
  @Post('upload-image')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('user-image'))
  public uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() payload: JWTPayload,
  ): Promise<User> {
    if (!file) throw new BadRequestException('no file provided');
    return this.usersService.setProfileImage(payload.id, file.filename);
  }

  @ApiOperation({ summary: 'Remove profile image' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image removed successfully.',
    type: User,
  })
  @Delete('images/remove-profile-image')
  @UseGuards(AuthGuard)
  public deleteProfileImage(@CurrentUser() payload: JWTPayload): Promise<User> {
    return this.usersService.deleteProfileImage(payload.id);
  }

  @ApiOperation({ summary: 'Show profile image' })
  @ApiParam({ name: 'image', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image returned.' })
  @Get('images/:image')
  @UseGuards(AuthGuard)
  public showProfileImage(
    @Param('image') image: string,
    @Res() res: Response,
  ): void {
    return res.sendFile(image, { root: 'images/users' });
  }

  @ApiOperation({ summary: 'Verify email' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'verificationToken', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully.',
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid token.',
  })
  @Get('verify-email/:id/:verificationToken')
  public verifyEmail(
    @Param('id', ParseIntPipe) userId: number,
    @Param('verificationToken') verificationToken: string,
  ): Promise<MessageResponse> {
    return this.usersService.verifyEmail(userId, verificationToken);
  }
}
