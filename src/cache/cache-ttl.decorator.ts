import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'cache_ttl_seconds';

/**
 * Decorador para configurar el TTL (en segundos) de la caché HTTP en los handlers de controladores.
 */
export const CacheTtl = (seconds: number) => SetMetadata(CACHE_TTL_KEY, seconds);
