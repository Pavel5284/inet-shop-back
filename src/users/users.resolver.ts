import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { GqlAuthGuard } from '../common/gql-auth.guard';
import { UpdateProfileInput } from './dto/update-profile.input';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { description: 'Текущий авторизованный пользователь' })
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.getById(user.id);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  updateProfile(@CurrentUser() user: AuthUser, @Args('input') input: UpdateProfileInput) {
    return this.usersService.update(user.id, input);
  }
}
