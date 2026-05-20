import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
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
}
