import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Length,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'iPhone 15' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Latest Apple smartphone' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 999.99, minimum: 0 })
  @Min(0)
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1 })
  @IsOptional()
  @Min(1)
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}
