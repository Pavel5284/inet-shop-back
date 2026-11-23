import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { ProductsService } from '../products/products.service';
import { Favorite } from './favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite) private readonly repo: Repository<Favorite>,
    private readonly productsService: ProductsService,
  ) {}

  async ids(userId: string): Promise<string[]> {
    const rows = await this.repo.find({ where: { userId }, select: { productId: true } });
    return rows.map((row) => row.productId);
  }

  list(userId: string): Promise<Product[]> {
    return this.repo
      .find({
        where: { userId },
        relations: { product: { category: true } },
        order: { createdAt: 'DESC' },
      })
      .then((rows) => rows.map((row) => row.product));
  }

  async toggle(userId: string, productId: string): Promise<boolean> {
    await this.productsService.getById(productId);
    const existing = await this.repo.findOne({ where: { userId, productId } });
    if (existing) {
      await this.repo.delete(existing.id);
      return false;
    }
    await this.repo.save(this.repo.create({ userId, productId }));
    return true;
  }
}
