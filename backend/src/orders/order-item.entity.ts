import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../products/product.entity';
import { Order } from './order.entity';

@ObjectType()
@Entity('order_items')
export class OrderItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Field(() => ID, { nullable: true, description: 'null, если товар позже удалили из каталога' })
  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  productSlug: string | null;

  @Field()
  @Column()
  title: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  @Field(() => Int)
  @Column({ type: 'int' })
  price: number;

  @Field(() => Int)
  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Field(() => Int)
  get lineTotal(): number {
    return this.price * this.quantity;
  }
}
