import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PaymentMethod } from '../order.enums';

@InputType()
export class CreateOrderInput {
  @Field()
  @IsString({ message: 'Укажите имя получателя' })
  @Length(1, 100, { message: 'Укажите имя получателя' })
  recipientName: string;

  @Field()
  @Matches(/^\+?[0-9()\-\s]{7,20}$/, { message: 'Некорректный номер телефона' })
  phone: string;

  @Field()
  @IsString({ message: 'Укажите адрес доставки' })
  @Length(1, 255, { message: 'Укажите адрес доставки' })
  address: string;

  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod, { message: 'Некорректный способ оплаты' })
  paymentMethod: PaymentMethod;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Комментарий должен быть строкой' })
  @MaxLength(500, { message: 'Комментарий слишком длинный' })
  comment?: string;
}
