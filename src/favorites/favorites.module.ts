import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { Favorite } from './favorite.entity';
import { FavoritesResolver } from './favorites.resolver';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite]), ProductsModule],
  providers: [FavoritesService, FavoritesResolver],
})
export class FavoritesModule {}
