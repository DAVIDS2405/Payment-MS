import { IsNumber, IsPositive, IsString } from 'class-validator';

export class PaymentSessionItemDto {
  @IsString()
  name: string;
  @IsNumber()
  @IsPositive()
  price: number;
  @IsNumber()
  @IsPositive()
  quantity: number;
}
