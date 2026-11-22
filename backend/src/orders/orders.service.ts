import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { CartItem } from '../cart/cart-item.entity';
import { Product } from '../products/product.entity';
import { CreateOrderInput } from './dto/create-order.input';
import { OrderItem } from './order-item.entity';
import { Order } from './order.entity';
import { OrderStatus, PaymentMethod } from './order.enums';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  list(userId: string) {
    return this.repo.find({
      where: { userId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
  }

  async get(userId: string, id: string) {
    const order = await this.repo.findOne({ where: { id, userId }, relations: { items: true } });
    if (!order) throw new NotFoundException('Заказ не найден');
    return order;
  }

  /** Оформляет заказ из корзины одной транзакцией: проверка остатков → заказ → списание → очистка корзины. */
  async create(userId: string, input: CreateOrderInput): Promise<Order> {
    const orderId = await this.dataSource.transaction(async (m) => {
      const cartItems = await m.find(CartItem, { where: { userId }, relations: { product: true } });
      if (!cartItems.length) throw new BadRequestException('Корзина пуста');

      // Блокируем строки товаров, чтобы два заказа не купили один и тот же остаток.
      const products = await m
        .createQueryBuilder(Product, 'p')
        .setLock('pessimistic_write')
        .where('p.id IN (:...ids)', { ids: cartItems.map((i) => i.productId) })
        .getMany();
      const byId = new Map(products.map((p) => [p.id, p]));

      for (const ci of cartItems) {
        const p = byId.get(ci.productId);
        if (!p || p.stock < ci.quantity) {
          throw new BadRequestException(
            `Товара «${ci.product.title}» осталось ${p?.stock ?? 0} шт. Измените количество в корзине.`,
          );
        }
      }

      const items = cartItems.map((ci) => {
        const p = byId.get(ci.productId)!;
        return m.create(OrderItem, {
          productId: p.id,
          productSlug: p.slug,
          title: p.title,
          image: p.images[0] ?? null,
          price: p.price,
          quantity: ci.quantity,
        });
      });

      const saved = await m.save(
        m.create(Order, {
          userId,
          status: OrderStatus.NEW,
          paymentMethod: input.paymentMethod,
          recipientName: input.recipientName.trim(),
          phone: input.phone.trim(),
          address: input.address.trim(),
          comment: input.comment?.trim() || null,
          totalPrice: items.reduce((s, i) => s + i.price * i.quantity, 0),
          items,
        }),
      );

      for (const ci of cartItems) {
        const p = byId.get(ci.productId)!;
        await m.update(Product, p.id, { stock: p.stock - ci.quantity, soldCount: p.soldCount + ci.quantity });
      }
      await m.delete(CartItem, { userId });
      return saved.id;
    });
    return this.get(userId, orderId);
  }

  /** Имитация онлайн-оплаты картой. */
  async pay(userId: string, id: string) {
    const order = await this.get(userId, id);
    if (order.status !== OrderStatus.NEW) throw new BadRequestException('Этот заказ нельзя оплатить');
    if (order.paymentMethod !== PaymentMethod.CARD) {
      throw new BadRequestException('Заказ оплачивается при получении');
    }
    order.status = OrderStatus.PAID;
    return this.repo.save(order);
  }

  /** Отмена заказа: возвращает товары на склад. */
  async cancel(userId: string, id: string) {
    return this.dataSource.transaction(async (m: EntityManager) => {
      const order = await m.findOne(Order, { where: { id, userId }, relations: { items: true } });
      if (!order) throw new NotFoundException('Заказ не найден');
      if (order.status !== OrderStatus.NEW && order.status !== OrderStatus.PAID) {
        throw new BadRequestException('Этот заказ уже нельзя отменить');
      }
      const productIds = order.items.map((i) => i.productId).filter((v): v is string => !!v);
      const products = productIds.length ? await m.findBy(Product, { id: In(productIds) }) : [];
      const byId = new Map(products.map((p) => [p.id, p]));
      for (const item of order.items) {
        const p = item.productId ? byId.get(item.productId) : undefined;
        if (p) {
          await m.update(Product, p.id, {
            stock: p.stock + item.quantity,
            soldCount: Math.max(0, p.soldCount - item.quantity),
          });
        }
      }
      order.status = OrderStatus.CANCELLED;
      return m.save(order);
    });
  }
}
