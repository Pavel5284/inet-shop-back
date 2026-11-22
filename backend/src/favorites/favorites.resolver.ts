import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { GqlAuthGuard } from '../common/gql-auth.guard';
import { Product } from '../products/product.entity';
import { FavoritesService } from './favorites.service';

@Resolver()
@UseGuards(GqlAuthGuard)
export class FavoritesResolver {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Query(() => [ID], {
    description: 'ID избранных товаров — чтобы закрашивать сердечки в каталоге',
  })
  favoriteIds(@CurrentUser() user: AuthUser) {
    return this.favoritesService.ids(user.id);
  }

  @Query(() => [Product], { description: 'Избранные товары (новые сверху)' })
  favorites(@CurrentUser() user: AuthUser) {
    return this.favoritesService.list(user.id);
  }

  @Mutation(() => Boolean, {
    description: 'Добавить/убрать из избранного. Возвращает новое состояние',
  })
  toggleFavorite(
    @CurrentUser() user: AuthUser,
    @Args('productId', { type: () => ID }) productId: string,
  ) {
    return this.favoritesService.toggle(user.id, productId);
  }
}
