import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
  NEW = 'NEW', // создан, ждёт оплаты / обработки
  PAID = 'PAID', // оплачен
  SHIPPED = 'SHIPPED', // передан в доставку
  DELIVERED = 'DELIVERED', // доставлен
  CANCELLED = 'CANCELLED', // отменён
}

export enum PaymentMethod {
  CARD = 'CARD', // онлайн-оплата картой (в демо — имитация)
  CASH = 'CASH', // наличными при получении
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });
