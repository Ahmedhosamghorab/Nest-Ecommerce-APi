import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Length,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiProperty({ example: 'Latest Apple smartphone' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  description: string;

  @ApiProperty({ example: 999.99, minimum: 0 })
  @Min(0)
  @IsNumber()
  price: number;

  @ApiProperty({ example: 10, minimum: 1 })
  @Min(1)
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}
