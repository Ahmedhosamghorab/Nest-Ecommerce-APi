import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
export class RegisterDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(250)
  email: string;
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  username: string;
  // @IsString()
  // @MaxLength(255)
  // profileImage: string;
}
