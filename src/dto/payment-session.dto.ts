import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaymentSessionItemDto } from './payment-session-item.dto';
import { Type } from 'class-transformer';

export class PaymentSessionDto {
  @IsString()
  orderId: string;
  @IsString()
  currency: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentSessionItemDto)
  items: PaymentSessionItemDto[];
}
