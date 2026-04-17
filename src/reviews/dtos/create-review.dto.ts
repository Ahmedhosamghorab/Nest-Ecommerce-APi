import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Length,
  Min,
  Max,
  MinLength,
} from 'class-validator';
export class CreateReviewDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rate: number;
  @IsString()
  @MinLength(1)
  comment: string;
}
