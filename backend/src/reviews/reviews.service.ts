import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { CreateReviewInput } from './dto/create-review.input';
import { Review } from './review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly repo: Repository<Review>,
    private readonly dataSource: DataSource,
  ) {}

  list(productId: string) {
    return this.repo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /** Отзыв, пересчёт рейтинга и проверка уникальности — одна транзакция. */
  async create(userId: string, input: CreateReviewInput): Promise<Review> {
    return this.dataSource.transaction(async (m) => {
      if (!(await m.findOne(Product, { where: { id: input.productId } }))) {
        throw new NotFoundException('Товар не найден');
      }
      if (await m.findOne(Review, { where: { productId: input.productId, userId } })) {
        throw new BadRequestException('Вы уже оставляли отзыв на этот товар');
      }
      const user = await m.findOne(User, { where: { id: userId } });
      if (!user) throw new UnauthorizedException('Сессия истекла, войдите снова');

      const review = await m.save(
        m.create(Review, {
          productId: input.productId,
          userId,
          authorName: `${user.firstName} ${user.lastName.charAt(0)}.`,
          rating: input.rating,
          text: input.text.trim(),
        }),
      );

      const stats = await m
        .createQueryBuilder(Review, 'r')
        .select('AVG(r.rating)', 'avg')
        .addSelect('COUNT(*)', 'count')
        .where('r.productId = :id', { id: input.productId })
        .getRawOne<{ avg: string | null; count: string }>();
      await m.update(Product, input.productId, {
        rating: stats?.avg ? Math.round(Number(stats.avg) * 10) / 10 : 0,
        reviewsCount: Number(stats?.count ?? 0),
      });
      return review;
    });
  }
}
