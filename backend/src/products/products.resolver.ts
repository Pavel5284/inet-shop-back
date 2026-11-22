import { Args, Query, Resolver } from '@nestjs/graphql';
import { ProductsArgs, ProductsPage } from './dto/products.args';
import { Product } from './product.entity';
import { ProductsService } from './products.service';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => ProductsPage, { description: 'Каталог: фильтры, сортировка, пагинация' })
  products(@Args() args: ProductsArgs) {
    return this.productsService.list(args);
  }

  @Query(() => Product, { description: 'Карточка товара по slug' })
  product(@Args('slug', { type: () => String }) slug: string) {
    return this.productsService.getBySlug(slug);
  }
}
