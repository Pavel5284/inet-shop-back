import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { GqlAuthGuard } from '../common/gql-auth.guard';
import { CreateOrderInput } from './dto/create-order.input';
import { Order } from './order.entity';
import { OrdersService } from './orders.service';

@Resolver(() => Order)
@UseGuards(GqlAuthGuard)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => [Order], { description: 'История заказов (новые сверху)' })
  orders(@CurrentUser() user: AuthUser) {
    return this.ordersService.list(user.id);
  }

  @Query(() => Order)
  order(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.ordersService.get(user.id, id);
  }

  @Mutation(() => Order, { description: 'Оформить заказ из текущей корзины' })
  createOrder(@CurrentUser() user: AuthUser, @Args('input') input: CreateOrderInput) {
    return this.ordersService.create(user.id, input);
  }

  @Mutation(() => Order, { description: 'Оплатить заказ (имитация)' })
  payOrder(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.ordersService.pay(user.id, id);
  }

  @Mutation(() => Order)
  cancelOrder(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.ordersService.cancel(user.id, id);
  }
}
