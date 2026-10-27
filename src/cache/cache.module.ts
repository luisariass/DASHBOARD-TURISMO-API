import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import Redis from 'ioredis';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { HttpCacheInterceptor } from './http-cache.interceptor';
import { REDIS_CLIENT } from './cache.constants';

/**
 * Módulo de caché con Redis.
 * Si Redis no está disponible o CACHE_ENABLED=false, la aplicación continúa funcionando sin caché.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [APP_CONFIG],
      useFactory: async (config: AppConfig): Promise<Redis | null> => {
        const logger = new Logger('Cache');

        if (!config.cacheEnabled) {
          logger.warn('Caché desactivado por CACHE_ENABLED=false');
          return null;
        }

        const client = new Redis(config.redisUrl, {
          lazyConnect: true,
          // Un solo reintento: si Redis no está, se sigue sin caché en vez de
          // bloquear el arranque reintentando indefinidamente.
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        });

        // Sin este handler, un fallo de conexión posterior al arranque tumbaría el proceso.
        client.on('error', () => undefined);

        try {
          await client.connect();
          await client.ping();
          logger.log('Conectado a Redis');
          return client;
        } catch {
          logger.warn('Redis no disponible, el caché estará desactivado');
          client.disconnect();
          return null;
        }
      },
    },
    HttpCacheInterceptor,
  ],
  exports: [REDIS_CLIENT, HttpCacheInterceptor],
})
export class CacheModule implements OnApplicationShutdown {
  private readonly logger = new Logger(CacheModule.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis | null) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Desconectado de Redis');
    }
  }
}
