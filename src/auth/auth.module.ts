import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { MailModule } from 'src/mail/mail.module';
import { AuthGuard } from './guards/auth.guard';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MailModule,
    TypeOrmModule.forFeature([User]),
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
  providers: [AuthService, AuthGuard, AuthRolesGuard],
  exports: [AuthService, JwtModule, AuthGuard, AuthRolesGuard],
})
export class AuthModule {}
