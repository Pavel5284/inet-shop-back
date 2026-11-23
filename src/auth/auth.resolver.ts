import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { AuthPayload } from './auth-payload.model';
import { AuthService } from './auth.service';
import { LoginInput, RegisterInput } from './dto/auth.inputs';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  // Вход и регистрация защищены строже остального API: 10 попыток в минуту с одного IP.
  @Mutation(() => AuthPayload)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => AuthPayload)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }
}
