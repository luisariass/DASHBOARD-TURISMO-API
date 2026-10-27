import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import Redis from 'ioredis';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { REDIS_CLIENT } from './cache.constants';
import { CACHE_TTL_KEY } from './cache-ttl.decorator';
import { buildCacheKey } from './cache-key';

/**
 * Interceptor de caché en la frontera HTTP.
 * La clave de caché se deriva de la ruta y de la query completa normalizada.
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ttl = this.reflector.get<number | undefined>(
      CACHE_TTL_KEY,
      context.getHandler(),
    );

    // Sin TTL declarado o sin Redis, la ruta pasa directa.
    if (!ttl || !this.redis) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (request.method !== 'GET') {
      return next.handle();
    }

    const key = buildCacheKey(
      request.route?.path ?? request.path,
      request.query as Record<string, unknown>,
    );

    return from(this.read(key)).pipe(
      switchMap((cached) => {
        if (cached !== null) {
          this.logger.debug(`Cache HIT: ${key}`);
          return of(cached);
        }
        this.logger.debug(`Cache MISS: ${key}`);
        return next
          .handle()
          .pipe(tap((response) => void this.write(key, response, ttl)));
      }),
    );
  }

  /** Un fallo de Redis degrada a "sin caché", nunca rompe la petición. */
  private async read(key: string): Promise<unknown | null> {
    try {
      const raw = await this.redis!.get(key);
      return raw === null ? null : JSON.parse(raw);
    } catch (error) {
      this.logger.warn(`Error leyendo caché: ${(error as Error).message}`);
      return null;
    }
  }

  private async write(
    key: string,
    response: unknown,
    ttl: number,
  ): Promise<void> {
    try {
      await this.redis!.setex(key, ttl, JSON.stringify(response));
    } catch (error) {
      this.logger.warn(`Error guardando en caché: ${(error as Error).message}`);
    }
  }
}
