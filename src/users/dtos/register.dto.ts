import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ahmed@gmail.com', maxLength: 250 })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(250)
  email: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Ahmed', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  username: string;

  // @ApiProperty({ example: 'https://example.com/profile.jpg' })
  // @IsString()
  // @MaxLength(255)
  // profileImage: string;
}
