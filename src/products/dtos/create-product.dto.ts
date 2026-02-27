import { IsString, IsNumber, IsNotEmpty, Length, Min } from 'class-validator';
export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  title: string;
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  description: string;
  @Min(0)
  @IsNumber()
  price: number;
}
