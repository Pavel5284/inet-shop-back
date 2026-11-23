import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private readonly repo: Repository<Category>) {}

  async list(): Promise<Category[]> {
    const { entities, raw } = await this.repo
      .createQueryBuilder('category')
      .addSelect(
        (sub) =>
          sub
            .select('COUNT(product.id)', 'count')
            .from(Product, 'product')
            .where('product.categoryId = category.id'),
        'productsCount',
      )
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.id', 'ASC')
      .getRawAndEntities<{ productsCount: string | number }>();

    entities.forEach((category, i) => {
      category.productsCount = Number(raw[i]?.productsCount ?? 0);
    });
    return entities;
  }
}
