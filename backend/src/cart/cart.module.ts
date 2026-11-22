import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { CartItem } from './cart-item.entity';
import { CartResolver } from './cart.resolver';
import { CartService } from './cart.service';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem]), ProductsModule],
  providers: [CartService, CartResolver],
})
export class CartModule {}
