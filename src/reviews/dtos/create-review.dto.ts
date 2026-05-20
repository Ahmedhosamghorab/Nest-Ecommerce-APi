import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rate: number;

  @ApiProperty({ example: 'Great product!' })
  @IsString()
  @MinLength(1)
  comment: string;
}
