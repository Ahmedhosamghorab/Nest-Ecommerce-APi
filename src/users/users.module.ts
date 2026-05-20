import { Module, BadRequestException, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MailModule } from 'src/mail/mail.module';
import { UserService } from './users.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [UsersController],
  imports: [
    MailModule,
    TypeOrmModule.forFeature([User]),
    MulterModule.register({
      storage: diskStorage({
        destination: 'images/users',
        filename: (_req, file, cb) => {
          const prefix = `${Date.now()}-${Math.round(Math.random() * 10000)}`;
          const filename = `${prefix}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image')) {
          return cb(null, true);
        }
        return cb(new BadRequestException('unsupported file format'), false);
      },
      limits: { fileSize: 1024 * 1024 * 2 },
    }),
    forwardRef(() => AuthModule),
  ],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UsersModule {}
