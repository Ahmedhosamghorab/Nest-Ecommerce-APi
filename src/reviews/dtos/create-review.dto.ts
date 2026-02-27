import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Length,
  Min,
  Max,
} from 'class-validator';
export class CreateReviewDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(5)
  rate: number;
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  comment: string;
}
