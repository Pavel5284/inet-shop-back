import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CartItem } from './cart-item.entity';

@ObjectType()
export class Cart {
  @Field(() => [CartItem])
  items: CartItem[];

  @Field(() => Int, { description: 'Всего штук' })
  totalCount: number;

  @Field(() => Int, { description: 'Сколько сэкономлено за счёт скидок' })
  totalDiscount: number;

  @Field(() => Int, { description: 'Сумма к оплате' })
  totalPrice: number;
}
