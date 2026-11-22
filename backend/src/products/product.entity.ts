import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';

@ObjectType()
@Entity('products')
export class Product {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Index({ unique: true })
  @Column()
  slug: string;

  @Field()
  @Column('text')
  description: string;

  @Field(() => Int, { description: 'Цена в целых рублях' })
  @Column('int')
  price: number;

  @Field(() => Int, { nullable: true, description: 'Цена до скидки' })
  @Column({ type: 'int', nullable: true })
  oldPrice: number | null;

  @Field(() => [String])
  @Column('text', { array: true })
  images: string[];

  @Field()
  @Column()
  brand: string;

  @Field(() => Int, { description: 'Остаток на складе' })
  @Column({ type: 'int', default: 0 })
  stock: number;

  @Field(() => Float, { description: 'Средняя оценка 0..5' })
  @Column({ type: 'float', default: 0 })
  rating: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  reviewsCount: number;

  @Column({ type: 'int', default: 0 })
  soldCount: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => ID)
  @Index()
  @Column()
  categoryId: string;

  @Field(() => Category)
  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Field(() => Int, { nullable: true, description: 'Скидка в процентах, если есть oldPrice' })
  get discountPercent(): number | null {
    return this.oldPrice && this.oldPrice > this.price
      ? Math.round((1 - this.price / this.oldPrice) * 100)
      : null;
  }
}
