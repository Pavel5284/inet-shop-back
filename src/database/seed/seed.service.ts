import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { DataSource } from 'typeorm';
import { CartItem } from '../../cart/cart-item.entity';
import { Category } from '../../categories/category.entity';
import type { AppConfig } from '../../config/configuration';
import { Favorite } from '../../favorites/favorite.entity';
import { OrderItem } from '../../orders/order-item.entity';
import { OrderStatus, PaymentMethod } from '../../orders/order.enums';
import { Order } from '../../orders/order.entity';
import { Product } from '../../products/product.entity';
import { Review } from '../../reviews/review.entity';
import { User } from '../../users/user.entity';
import { DEMO_USER, REVIEW_AUTHORS, REVIEW_TEXTS, SEED_CATEGORIES } from './seed-data';

const RU: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const slugify = (s: string) =>
  [...s.toLowerCase()].map((ch) => RU[ch] ?? ch).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Детерминированный генератор случайных чисел: при каждом seed данные одинаковые. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get('seedOnStart', { infer: true })) await this.run();
  }

  /** Заполняет пустую базу. Если данные уже есть — ничего не делает. Возвращает true, если данные были созданы. */
  async run(): Promise<boolean> {
    if ((await this.dataSource.getRepository(Category).count()) > 0) {
      this.logger.log('База уже содержит данные — seed пропущен');
      return false;
    }
    const rnd = mulberry32(42);
    const randInt = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
    const pick = <T>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
    const passwordHash = await hash(DEMO_USER.password, 10);

    await this.dataSource.transaction(async (m) => {
      // 1. Категории и товары
      const products: Product[] = [];
      const pendingReviews: [Product, Review][] = []; // (товар, его отзыв): productId проставим после сохранения товаров

      for (const [ci, c] of SEED_CATEGORIES.entries()) {
        const category = await m.save(
          m.create(Category, { name: c.name, slug: c.slug, icon: c.icon, sortOrder: ci }),
        );

        for (const [title, brand, price, oldPrice] of c.products) {
          const slug = slugify(`${title}-${brand}`);
          const product = m.create(Product, {
            title,
            slug,
            brand,
            price,
            oldPrice: oldPrice || null,
            description:
              `${title} — ${brand}. ${c.blurb} Товар в наличии на складе, отправляем в день заказа. ` +
              `Возврат в течение 14 дней, если товар не подошёл.`,
            images: [1, 2, 3].map((n) => `https://picsum.photos/seed/${slug}-${n}/800/800`),
            stock: randInt(5, 150),
            soldCount: randInt(0, 500),
            createdAt: new Date(Date.now() - randInt(1, 120) * DAY),
            categoryId: category.id,
          });

          // Отзывы: 0–5 штук, оценки 3–5
          const count = randInt(0, 5);
          let sum = 0;
          const own: Review[] = [];
          for (let i = 0; i < count; i++) {
            const rating = pick([5, 5, 5, 4, 4, 3]);
            sum += rating;
            own.push(
              m.create(Review, {
                authorName: pick(REVIEW_AUTHORS),
                rating,
                text: pick(REVIEW_TEXTS[rating]),
                createdAt: new Date(Date.now() - randInt(1, 60) * DAY),
              }),
            );
          }
          product.reviewsCount = count;
          product.rating = count ? Math.round((sum / count) * 10) / 10 : 0;
          products.push(product);
          pendingReviews.push(...own.map((r): [Product, Review] => [product, r]));
        }
      }

      // Несколько товаров «нет в наличии» — чтобы проверить этот сценарий в интерфейсе
      for (const i of [7, 31, 52]) products[i].stock = 0;

      const savedProducts = await m.save(products);
      const byIndex = (i: number) => savedProducts[i];
      for (const [product, review] of pendingReviews) review.productId = product.id;
      await m.save(pendingReviews.map(([, review]) => review));

      // 2. Демо-пользователь
      const demo = await m.save(
        m.create(User, {
          email: DEMO_USER.email,
          passwordHash,
          firstName: DEMO_USER.firstName,
          lastName: DEMO_USER.lastName,
          phone: DEMO_USER.phone,
          address: DEMO_USER.address,
        }),
      );

      // 3. Избранное и корзина демо-пользователя
      await m.save(
        [0, 4, 20, 36].map((i) => m.create(Favorite, { userId: demo.id, productId: byIndex(i).id })),
      );
      await m.save([
        m.create(CartItem, { userId: demo.id, productId: byIndex(5).id, quantity: 1 }),
        m.create(CartItem, { userId: demo.id, productId: byIndex(9).id, quantity: 2 }),
      ]);

      // 4. Три заказа в разных статусах
      const makeOrder = (status: OrderStatus, payment: PaymentMethod, daysAgo: number, lines: [number, number][]) => {
        const items = lines.map(([pi, quantity]) => {
          const p = byIndex(pi);
          return m.create(OrderItem, {
            productId: p.id,
            productSlug: p.slug,
            title: p.title,
            image: p.images[0],
            price: p.price,
            quantity,
          });
        });
        return m.create(Order, {
          userId: demo.id,
          status,
          paymentMethod: payment,
          recipientName: `${DEMO_USER.firstName} ${DEMO_USER.lastName}`,
          phone: DEMO_USER.phone,
          address: DEMO_USER.address,
          totalPrice: items.reduce((s, i) => s + i.price * i.quantity, 0),
          items,
          createdAt: new Date(Date.now() - daysAgo * DAY),
        });
      };
      await m.save(makeOrder(OrderStatus.DELIVERED, PaymentMethod.CARD, 30, [[2, 1], [10, 1]]));
      await m.save(makeOrder(OrderStatus.SHIPPED, PaymentMethod.CARD, 3, [[4, 1], [14, 2]]));
      await m.save(makeOrder(OrderStatus.NEW, PaymentMethod.CARD, 0, [[17, 1], [25, 1]]));
    });

    this.logger.log(`Seed выполнен. Демо-аккаунт: ${DEMO_USER.email} / ${DEMO_USER.password}`);
    return true;
  }
}
