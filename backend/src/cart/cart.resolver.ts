import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { GqlAuthGuard } from '../common/gql-auth.guard';
import { Cart } from './cart.model';
import { CartService } from './cart.service';

@Resolver(() => Cart)
@UseGuards(GqlAuthGuard)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Query(() => Cart)
  cart(@CurrentUser() user: AuthUser) {
    return this.cartService.getCart(user.id);
  }

  @Mutation(() => Cart, { description: 'Добавить товар (увеличивает количество, если уже в корзине)' })
  addToCart(
    @CurrentUser() user: AuthUser,
    @Args('productId', { type: () => ID }) productId: string,
    @Args('quantity', { type: () => Int, defaultValue: 1 }) quantity: number,
  ) {
    return this.cartService.add(user.id, productId, quantity);
  }

  @Mutation(() => Cart, { description: 'Установить количество; 0 — удалить позицию' })
  setCartItemQuantity(
    @CurrentUser() user: AuthUser,
    @Args('productId', { type: () => ID }) productId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
  ) {
    return this.cartService.setQuantity(user.id, productId, quantity);
  }

  @Mutation(() => Cart)
  removeFromCart(
    @CurrentUser() user: AuthUser,
    @Args('productId', { type: () => ID }) productId: string,
  ) {
    return this.cartService.remove(user.id, productId);
  }

  @Mutation(() => Cart)
  clearCart(@CurrentUser() user: AuthUser) {
    return this.cartService.clear(user.id);
  }
}
