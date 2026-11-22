import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { Cart } from './cart.model';
import { CartItem } from './cart-item.entity';

const MAX_PER_POSITION = 20;

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem) private readonly repo: Repository<CartItem>,
    private readonly productsService: ProductsService,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    const items = await this.repo.find({
      where: { userId },
      relations: { product: { category: true } },
      order: { createdAt: 'ASC' },
    });
    return {
      items,
      totalCount: items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: items.reduce((sum, i) => sum + i.lineTotal, 0),
      totalDiscount: items.reduce(
        (sum, i) => sum + Math.max(0, (i.product.oldPrice ?? i.product.price) - i.product.price) * i.quantity,
        0,
      ),
    };
  }

  async add(userId: string, productId: string, quantity: number): Promise<Cart> {
    if (quantity <= 0) throw new BadRequestException('Некорректное количество');
    const product = await this.productsService.getById(productId);
    if (product.stock <= 0) throw new BadRequestException('Товара нет в наличии');

    const existing = await this.repo.findOne({ where: { userId, productId } });
    const next = Math.min((existing?.quantity ?? 0) + quantity, product.stock, MAX_PER_POSITION);
    await this.repo.save(existing ? { ...existing, quantity: next } : { userId, productId, quantity: next });
    return this.getCart(userId);
  }

  async setQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
    if (quantity <= 0) {
      await this.repo.delete({ userId, productId });
      return this.getCart(userId);
    }
    const product = await this.productsService.getById(productId);
    if (product.stock <= 0) throw new BadRequestException('Товара нет в наличии');
    const next = Math.min(quantity, product.stock, MAX_PER_POSITION);

    const existing = await this.repo.findOne({ where: { userId, productId } });
    await this.repo.save(existing ? { ...existing, quantity: next } : { userId, productId, quantity: next });
    return this.getCart(userId);
  }

  async remove(userId: string, productId: string): Promise<Cart> {
    await this.repo.delete({ userId, productId });
    return this.getCart(userId);
  }

  async clear(userId: string): Promise<Cart> {
    await this.repo.delete({ userId });
    return this.getCart(userId);
  }
}
