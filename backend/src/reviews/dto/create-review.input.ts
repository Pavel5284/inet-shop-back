import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString, IsUUID, Length, Max, Min } from 'class-validator';

@InputType()
export class CreateReviewInput {
  @Field(() => ID)
  @IsUUID('all', { message: 'Некорректный идентификатор товара' })
  productId: string;

  @Field(() => Int)
  @IsInt({ message: 'Оценка должна быть целым числом' })
  @Min(1, { message: 'Оценка должна быть от 1 до 5' })
  @Max(5, { message: 'Оценка должна быть от 1 до 5' })
  rating: number;

  @Field()
  @IsString({ message: 'Отзыв должен быть строкой' })
  @Length(3, 2000, { message: 'Отзыв должен быть от 3 до 2000 символов' })
  text: string;
}
