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
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(5)
  rate?: number;
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  comment?: string;
}
