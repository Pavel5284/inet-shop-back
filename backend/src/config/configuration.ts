/**
 * Все настройки приложения читаются из переменных окружения (файл .env или Docker).
 * Здесь они превращаются в один типизированный объект.
 */
const configuration = () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT ?? '3000', 10),
  // Сколько reverse-proxy стоит перед приложением (0 — нет). Нужно, чтобы rate limit видел настоящий IP клиента.
  trustProxyHops: parseInt(process.env.TRUST_PROXY_HOPS ?? '0', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  seedOnStart: process.env.SEED_ON_START === 'true',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'shop',
    password: process.env.DB_PASSWORD ?? 'shop_pass',
    database: process.env.DB_NAME ?? 'shop',
    // В production схему меняют только миграциями. synchronize нужен лишь для экспериментов.
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-dev-secret-change-me-dev-secret',
    expiresInSeconds: parseInt(process.env.JWT_EXPIRES_IN_SECONDS ?? '604800', 10), // 7 дней
  },
});

export default configuration;
export type AppConfig = ReturnType<typeof configuration>;
