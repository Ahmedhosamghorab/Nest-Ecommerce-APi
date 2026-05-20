import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Length,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class UpdateReviewDto {
  @ApiPropertyOptional({ example: 4, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(5)
  rate?: number;

  @ApiPropertyOptional({ example: 'Very good product' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  comment?: string;
}
