import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'cache_ttl_seconds';

/**
 * Equivalente al argumento ttl_seconds del decorador @cached de FastAPI, pero
 * aplicado al handler HTTP en vez de a la función de consulta. La ruta sin este
 * decorador no se cachea, lo que hace explícito qué se cachea y qué no: en la
 * versión Python el módulo de Google se quedó sin caché por descuido, no por
 * decisión.
 */
export const CacheTtl = (seconds: number) => SetMetadata(CACHE_TTL_KEY, seconds);
