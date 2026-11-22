import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../users/user.entity';

@ObjectType()
export class AuthPayload {
  @Field(() => String, { description: 'JWT. Передавайте в заголовке Authorization: Bearer <token>' })
  accessToken: string;

  @Field(() => User)
  user: User;
}
