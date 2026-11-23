import { BadRequestException, Logger, ValidationError, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

/** Собирает ошибки class-validator в одну читаемую строку. */
function flattenErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((e) => [
    ...Object.values(e.constraints ?? {}),
    ...flattenErrors(e.children ?? []),
  ]);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(flattenErrors(errors).join('; ')),
    }),
  );

  // За reverse-proxy (nginx/Caddy) нужно доверять X-Forwarded-For, иначе rate limit видит один IP.
  const proxyHops = config.get('trustProxyHops', { infer: true });
  if (proxyHops > 0) app.set('trust proxy', proxyHops);

  if (config.get('isProduction', { infer: true })) app.use(helmet());

  const origins = config.get('corsOrigins', { infer: true });
  if (origins.length) app.enableCors({ origin: origins });

  app.enableShutdownHooks(); // корректно закрываем соединения при остановке контейнера

  const port = config.get('port', { infer: true });
  await app.listen(port, '0.0.0.0');
  Logger.log(`GraphQL: http://localhost:${port}/graphql  |  health: /health`, 'Bootstrap');
}

void bootstrap();
