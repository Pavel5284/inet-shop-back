import { ExecutionContext, Injectable, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GqlThrottlerGuard } from '../common/gql-throttler.guard';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { User } from './user.entity';

/**
 * Глобальный rate limit для GraphQL. Базовый GqlThrottlerGuard рассчитан на GraphQL-контекст,
 * поэтому для REST /health возвращаем обычный express-контекст — иначе healthcheck упадёт.
 */
@Injectable()
class AppThrottlerGuard extends GqlThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    if (context.getType() === 'http') {
      const http = context.switchToHttp();
      return { req: http.getRequest(), res: http.getResponse() };
    }
    return super.getRequestResponse(context);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    UsersService,
    UsersResolver,
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
  ],
  exports: [UsersService],
})
export class UsersModule {}
