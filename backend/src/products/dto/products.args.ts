import { ArgsType, Field, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Product } from '../product.entity';

export enum ProductSort {
  NEWEST = 'NEWEST',
  POPULAR = 'POPULAR',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  RATING = 'RATING',
}

registerEnumType(ProductSort, { name: 'ProductSort' });

@InputType()
export class ProductsFilterInput {
  @Field(() => String, { nullable: true, description: 'slug категории' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @Field(() => Boolean, { nullable: true, description: 'Только товары в наличии' })
  @IsOptional()
  inStock?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  minPrice?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  maxPrice?: number;

  @Field(() => String, { nullable: true, description: 'Поиск по названию, бренду и описанию' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

@ArgsType()
export class ProductsArgs {
  @Field(() => ProductsFilterInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductsFilterInput)
  filter?: ProductsFilterInput;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  page: number = 1;

  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  pageSize: number = 20;

  @Field(() => ProductSort, { defaultValue: ProductSort.POPULAR })
  @IsEnum(ProductSort)
  sort: ProductSort = ProductSort.POPULAR;
}

@ObjectType()
export class ProductsPage {
  @Field(() => [Product])
  items: Product[];

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;
}
