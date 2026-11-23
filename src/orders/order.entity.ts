import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus, PaymentMethod } from './order.enums';

@ObjectType()
@Entity('orders')
export class Order {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Int, { description: 'Человекочитаемый номер заказа' })
  @Generated('increment')
  @Column({ type: 'int' })
  number: number;

  @Column({ type: 'uuid' })
  userId: string;

  @Field(() => OrderStatus)
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.NEW })
  status: OrderStatus;

  @Field(() => PaymentMethod)
  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Field()
  @Column()
  recipientName: string;

  @Field()
  @Column()
  phone: string;

  @Field()
  @Column()
  address: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  comment: string | null;

  @Field(() => Int)
  @Column({ type: 'int' })
  totalPrice: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field(() => [OrderItem])
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: ['insert'] })
  items: OrderItem[];
}
