import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Length,
  Min,
  IsOptional,
} from 'class-validator';
export class UpdateProductDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  title?: string;
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  description?: string;
  @Min(0)
  @IsNumber()
  @IsOptional()
  price?: number;
}
