import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(255, { message: 'Email слишком длинный' })
  email: string;

  @Field()
  @IsString({ message: 'Пароль должен быть строкой' })
  @Length(8, 72, { message: 'Пароль должен быть от 8 до 72 символов' })
  password: string;

  @Field()
  @IsString({ message: 'Имя должно быть строкой' })
  @Length(1, 50, { message: 'Укажите имя (не более 50 символов)' })
  firstName: string;

  @Field()
  @IsString({ message: 'Фамилия должна быть строкой' })
  @Length(1, 50, { message: 'Укажите фамилию (не более 50 символов)' })
  lastName: string;
}

@InputType()
export class LoginInput {
  @Field()
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @Field()
  @IsString({ message: 'Пароль должен быть строкой' })
  password: string;
}
