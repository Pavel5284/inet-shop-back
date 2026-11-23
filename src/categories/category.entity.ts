import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity('categories')
export class Category {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Index({ unique: true })
  @Column()
  slug: string;

  @Field({ description: 'Эмодзи-иконка категории' })
  @Column()
  icon: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  // Количество товаров не хранится в БД: сервис считает его подзапросом.
  @Field(() => Int)
  productsCount: number;
}
