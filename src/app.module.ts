import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { HealthController } from './common/health.controller';
import configuration, { AppConfig } from './config/configuration';
import { validateEnv } from './config/validate-env';
import { SeedModule } from './database/seed/seed.module';
import { FavoritesModule } from './favorites/favorites.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        type: 'postgres' as const,
        host: config.get('db.host', { infer: true }),
        port: config.get('db.port', { infer: true }),
        username: config.get('db.username', { infer: true }),
        password: config.get('db.password', { infer: true }),
        database: config.get('db.database', { infer: true }),
        uuidExtension: 'pgcrypto' as const, // gen_random_uuid() встроена в PostgreSQL 13+
        installExtensions: false, // не требуем прав на CREATE EXTENSION
        autoLoadEntities: true,
        synchronize: config.get('db.synchronize', { infer: true }),
        // При старте автоматически применяем новые миграции.
        migrations: [join(__dirname, 'database/migrations/*.js')],
        migrationsRun: true,
      }),
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const isProd = config.get('isProduction', { infer: true });
        return {
          path: '/graphql',
          autoSchemaFile: true, // схема строится из TypeScript-классов (code-first) и хранится в памяти
          sortSchema: true,
          context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
          introspection: !isProd,
          graphiql: !isProd, // встроенная IDE по адресу /graphql (только не в production)
          includeStacktraceInErrorResponses: !isProd,
        };
      },
    }),

    // Общий лимит: 120 запросов в минуту (на auth-мутациях — строже, см. AuthResolver).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    ReviewsModule,
    CartModule,
    FavoritesModule,
    OrdersModule,
    SeedModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
