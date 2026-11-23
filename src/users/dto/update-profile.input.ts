import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class UpdateProfileInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой' })
  @MaxLength(50, { message: 'Имя слишком длинное' })
  firstName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Фамилия должна быть строкой' })
  @MaxLength(50, { message: 'Фамилия слишком длинная' })
  lastName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Телефон должен быть строкой' })
  @MaxLength(50, { message: 'Телефон слишком длинный' })
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Адрес должен быть строкой' })
  @MaxLength(255, { message: 'Адрес слишком длинный' })
  address?: string;
}
