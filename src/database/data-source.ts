/**
 * DataSource для CLI TypeORM (генерация и запуск миграций).
 * Приложение NestJS использует свою конфигурацию из app.module.ts — эта нужна только для команд `npm run migration:*`.
 * Читает те же переменные окружения (DB_HOST и т.д.).
 */
import { join } from 'node:path';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'shop',
  password: process.env.DB_PASSWORD ?? 'shop_pass',
  database: process.env.DB_NAME ?? 'shop',
  // gen_random_uuid() встроена в PostgreSQL 13+ — расширения uuid-ossp не требуется
  uuidExtension: 'pgcrypto',
  installExtensions: false,
  entities: [join(__dirname, '..', '**', '*.entity.js')],
  migrations: [join(__dirname, 'migrations', '*.js')],
});
