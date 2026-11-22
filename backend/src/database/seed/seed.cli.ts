/** Запуск вручную: `npm run seed` (после сборки). Заполняет БД, только если она пустая. */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeedService } from './seed.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.get(SeedService).run();
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
