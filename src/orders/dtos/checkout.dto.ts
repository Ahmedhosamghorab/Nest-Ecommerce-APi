import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({ example: 'Ahmed' })
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Hossam' })
  @IsNotEmpty()
  @IsString()
  last_name: string;

  @ApiProperty({ example: 'ahmed@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+201234567890' })
  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @ApiProperty({ example: '12A' })
  @IsNotEmpty()
  @IsString()
  apartment: string;

  @ApiProperty({ example: '3' })
  @IsNotEmpty()
  @IsString()
  floor: string;

  @ApiProperty({ example: 'Tahrir Street' })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({ example: '15' })
  @IsNotEmpty()
  @IsString()
  building: string;

  @ApiProperty({ example: 'Cairo' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Egypt' })
  @IsNotEmpty()
  @IsString()
  country: string;
}
