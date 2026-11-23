import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProductsArgs, ProductsFilterInput, ProductsPage, ProductSort } from './dto/products.args';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private readonly repo: Repository<Product>) {}

  async list(args: ProductsArgs): Promise<ProductsPage> {
    // Значения за пределами диапазона зажимаем, а не отклоняем запрос.
    const page = Math.max(1, args.page ?? 1);
    const pageSize = Math.min(60, Math.max(1, args.pageSize ?? 20));

    const qb = this.repo.createQueryBuilder('p').leftJoinAndSelect('p.category', 'category');
    this.applyFilter(qb, args.filter);
    this.applySort(qb, args.sort ?? ProductSort.POPULAR);

    const [items, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  private applyFilter(qb: SelectQueryBuilder<Product>, filter?: ProductsFilterInput) {
    if (!filter) return;
    if (filter.categorySlug) {
      qb.andWhere('category.slug = :categorySlug', { categorySlug: filter.categorySlug });
    }
    if (filter.search) {
      // ILIKE treats \, % and _ as wildcards — экранируем их, чтобы поиск был буквальным.
      const pattern = `%${filter.search.replace(/[\\%_]/g, '\\$&')}%`;
      qb.andWhere(
        `(p.title ILIKE :q ESCAPE '\\' OR p.brand ILIKE :q ESCAPE '\\' OR p.description ILIKE :q ESCAPE '\\')`,
        { q: pattern },
      );
    }
    if (filter.minPrice !== undefined && filter.minPrice !== null) {
      qb.andWhere('p.price >= :minPrice', { minPrice: filter.minPrice });
    }
    if (filter.maxPrice !== undefined && filter.maxPrice !== null) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice: filter.maxPrice });
    }
    if (filter.inStock) {
      qb.andWhere('p.stock > 0');
    }
  }

  private applySort(qb: SelectQueryBuilder<Product>, sort: ProductSort) {
    // Вторичная сортировка по id делает пагинацию стабильной при равных значениях.
    switch (sort) {
      case ProductSort.PRICE_ASC:
        qb.orderBy('p.price', 'ASC').addOrderBy('p.id', 'ASC');
        break;
      case ProductSort.PRICE_DESC:
        qb.orderBy('p.price', 'DESC').addOrderBy('p.id', 'ASC');
        break;
      case ProductSort.RATING:
        qb.orderBy('p.rating', 'DESC').addOrderBy('p.reviewsCount', 'DESC').addOrderBy('p.id', 'ASC');
        break;
      case ProductSort.NEWEST:
        qb.orderBy('p.createdAt', 'DESC').addOrderBy('p.id', 'ASC');
        break;
      case ProductSort.POPULAR:
      default:
        qb.orderBy('p.soldCount', 'DESC').addOrderBy('p.id', 'ASC');
    }
  }

  async getBySlug(slug: string) {
    const product = await this.repo.findOne({ where: { slug }, relations: { category: true } });
    if (!product) throw new NotFoundException('Товар не найден');
    return product;
  }

  async getById(id: string) {
    const product = await this.repo.findOne({ where: { id }, relations: { category: true } });
    if (!product) throw new NotFoundException('Товар не найден');
    return product;
  }
}
