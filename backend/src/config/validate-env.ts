/** Останавливает запуск в production, если секреты не настроены. */
export function validateEnv(env: Record<string, unknown>): Record<string, unknown> {
  if (env.NODE_ENV === 'production') {
    const secret = String(env.JWT_SECRET ?? '');
    if (secret.length < 32 || secret.startsWith('change-me')) {
      throw new Error('JWT_SECRET должен быть случайной строкой не короче 32 символов (production).');
    }
    if (!env.DB_PASSWORD || env.DB_PASSWORD === 'shop_pass') {
      throw new Error('Задайте надёжный DB_PASSWORD (production).');
    }
  }
  return env;
}
