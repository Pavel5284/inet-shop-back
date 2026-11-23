import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';

@ObjectType()
@Entity('reviews')
@Index(['productId', 'userId'], { unique: true })
export class Review {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  // NULL у демо-отзывов: они не привязаны к аккаунту.
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Field({ description: 'Имя автора, например «Анна К.»' })
  @Column()
  authorName: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  rating: number;

  @Field()
  @Column('text')
  text: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
