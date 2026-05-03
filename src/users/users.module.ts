import { BadRequestException, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './users.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { AuthProvider } from './auth.provider';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';
@Module({
  controllers: [UsersController],
  imports: [
    MailModule,
    TypeOrmModule.forFeature([User]),
    MulterModule.register({
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
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          global: true,
          secret: config.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: config.get<StringValue>('JWT_EXPIRES_IN'),
          },
        };
      },
    }),
  ],
  exports: [UserService],
  providers: [UserService, AuthProvider, MailService],
})
export class UsersModule {}
