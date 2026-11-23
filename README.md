# inet-shop-back

Бэкенд интернет-магазина-маркетплейса (аналог Ozon) для React-фронтенда из соседнего репозитория `inet-shop-front`.

Стек: **NestJS 12 · GraphQL (code-first, Apollo Server 5) · TypeORM 1.x · PostgreSQL 18 · Docker**.

## Содержание

- [Структура](#структура)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Демо-аккаунт](#демо-аккаунт)
- [Переменные окружения](#переменные-окружения)
- [Скрипты](#скрипты)
- [API](#api)
- [Тестирование](#тестирование)
- [Production](#production)
- [Известные ограничения](#известные-ограничения)

## Структура

Этот репозиторий — сам бэкенд, дополнительной папки `backend/` нет. Фронтенд живёт отдельно в `../inet-shop-front`, compose собирает его оттуда.

```text
inet-shop-back/
├── src/
│   ├── auth/          # регистрация, вход, JWT
│   ├── cart/          # корзина
│   ├── categories/    # категории и счётчик товаров
│   ├── common/        # auth-guard, throttler, /health
│   ├── config/        # конфигурация и валидация окружения
│   ├── database/      # DataSource, миграции, seed
│   ├── favorites/     # избранное
│   ├── orders/        # заказы (транзакции)
│   ├── products/      # каталог, фильтры, поиск, пагинация
│   ├── reviews/       # отзывы и пересчёт рейтинга
│   ├── users/         # профиль
│   ├── app.module.ts
│   └── main.ts
├── scripts/e2e.mjs    # приёмочный тест API (40 проверок)
├── deploy/Caddyfile   # reverse-proxy и TLS для прода
├── Dockerfile
├── docker-compose.yml         # локальный запуск
├── docker-compose.prod.yml    # сервер
└── .env.example
```

## Требования

- Node.js **≥ 22.12** (в Docker используется `node:26-alpine`), npm.
- Docker с Compose plugin (для локальной БД и полного стека).
- PostgreSQL **≥ 13** (в compose — `postgres:18-alpine`; данные монтируются в `/var/lib/postgresql`).

## Быстрый старт

### Весь стек в Docker

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

- Магазин: <http://localhost:8080>
- GraphiQL (dev): <http://localhost:3000/graphql>
- Health: <http://localhost:3000/health> → `{"status":"ok","db":"up"}`
- PostgreSQL: `127.0.0.1:5432` (только локальный интерфейс)

При первом старте миграции применяются автоматически, пустая БД заполняется тестовыми данными (`SEED_ON_START: "true"` в dev-compose).

### Только бэкенд на хосте

```powershell
Copy-Item .env.example .env
docker compose up -d db
npm install
# в .env выставьте SEED_ON_START=true
npm run start:dev
```

Бэкенд подключится к БД на `localhost:5432`, сам применит миграции и выполнит seed. Для останова:

```powershell
npm run start:prod   # или node dist/main.js после npm run build
```

### Сброс данных

```powershell
docker compose down -v
docker compose up -d --build
```

## Демо-аккаунт

| Email | Пароль |
|---|---|
| `demo@example.com` | `Demo12345!` |

У аккаунта: 4 товара в избранном, 2 позиции в корзине (3 шт.), 3 заказа в статусах `DELIVERED`, `SHIPPED`, `NEW`. Каталог seed: 8 категорий × 8 товаров = 64 товара.

## Переменные окружения

Шаблон — `.env.example`, рабочий файл — `.env` (в `.gitignore`, в репозиторий не попадает).

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `NODE_ENV` | `development` | `production` включает строгую проверку секретов, `helmet`, отключает GraphiQL и интроспекцию |
| `PORT` | `3000` | порт HTTP/GraphQL |
| `POSTGRES_VERSION` | `18` | тег образа PostgreSQL в compose |
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | подключение приложения на хосте (в compose — `db:5432`) |
| `DB_PORT_HOST` | `5432` | порт БД на хосте в dev-compose |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `shop` / `shop_pass` / `shop` | учётные данные БД |
| `JWT_SECRET` | dev-значение | в production: случайная строка ≥ 32 символов, не начинается с `change-me` |
| `JWT_EXPIRES_IN_SECONDS` | `604800` | срок жизни токена (7 суток) |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:8080` | список origin через запятую; пусто — CORS выключен |
| `SEED_ON_START` | `false` | заполнить пустую БД демо-данными при старте |
| `DB_SYNCHRONIZE` | `false` | только для экспериментов; в production запрещено |
| `TRUST_PROXY_HOPS` | `0` | число reverse-proxy (0 — нет, 1 — nginx, 2 — Caddy + nginx) |
| `DOMAIN` | `shop.example.com` | домен для Caddy (только prod) |
| `APP_VERSION` | `1.0.0` | тег образов в prod |
| `VITE_SHOW_DEMO_LOGIN`, `VITE_CURRENCY` | `false`, `RUB` | аргументы сборки фронтенда |

## Скрипты

```text
npm run typecheck      # tsc --noEmit
npm run lint           # oxlint src
npm run build          # nest build → dist/
npm run format         # prettier --write "src/**/*.ts"
npm run start:dev      # watch-режим
npm run start:prod     # node dist/main.js
npm run seed           # заполнить пустую БД (идемпотентно)
npm run migration:show # статус миграций
npm run migration:run  # применить миграции вручную
npm run e2e            # приёмочный тест API
```

Начальная миграция уже лежит в `src/database/migrations/` и применяется при старте. После изменения сущностей сгенерируйте новую:

```powershell
npm run migration:generate -- src/database/migrations/ChangeDescription
npm run build
```

## API

GraphQL endpoint: `POST /graphql`. Заголовок авторизации: `Authorization: Bearer <accessToken>`.

**Публичные:** `categories`, `products`, `product`, `reviews`, `register`, `login`.

**Требуют токен:** `me`, `updateProfile`, `cart`, `addToCart`, `setCartItemQuantity`, `removeFromCart`, `clearCart`, `favorites`, `favoriteIds`, `toggleFavorite`, `orders`, `order`, `createOrder`, `payOrder`, `cancelOrder`, `createReview`.

Пользователь видит только свои корзину, избранное и заказы. Ошибки валидации приходят одной строкой на русском языке; без токена — `UNAUTHENTICATED`.

Пример запроса:

```graphql
query {
  products(filter: { search: "смартфон", inStock: true }, sort: PRICE_ASC, page: 1, pageSize: 20) {
    total
    totalPages
    items { id slug title price discountPercent rating category { slug name } }
  }
}
```

## Тестирование

```powershell
# БД должна быть свежей, бэкенд — запущен
npm run e2e
```

Ожидаемый вывод: 40 × `PASS`, 0 × `FAIL` и `Все проверки пройдены ✅`.

Тест изменяет данные демо-пользователя, оформляет/отменяет заказ и в конце намеренно упирается в rate limit. Для повторного прогона сбросьте БД (`docker compose down -v` → `docker compose up -d --build`) и подождите минуту.

## Production

1. Создайте `.env` на сервере: надёжный `JWT_SECRET` (≥ 32 случайных символов), нестандартный `DB_PASSWORD`, ваш `DOMAIN`. Проверить генератор: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
2. Запуск:

```powershell
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Наружу открываются только порты **80/443** (Caddy с Let's Encrypt). У `db` и `backend` портов нет. `synchronize` выключен, схема меняется только миграциями, `TRUST_PROXY_HOPS=2` (Caddy → nginx → backend). Тома `pgdata`, `caddy_data` и `caddy_config` хранят БД и TLS-сертификаты — не удаляйте их.

## Известные ограничения

- Rate limit хранится в памяти процесса: сбрасывается при рестарте и не общий для нескольких реплик.
- Деньги хранятся целыми рублями (сознательное упрощение ТЗ).
- Seed считает БД заполненной по наличию категорий: частично заполненная БД не до seed-ится.
- Проверка `/health` требует доступной PostgreSQL; при недоступности возвращается 503.
