import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { APP_CONFIG, loadConfiguration } from './configuration';

/**
 * Global para no repetir el import en cada módulo de feature. La configuración
 * se resuelve una sola vez al arrancar, igual que hacía @lru_cache sobre
 * get_settings() en la versión de FastAPI.
 */
@Global()
@Module({
  imports: [NestConfigModule.forRoot({ envFilePath: '.env' })],
  providers: [{ provide: APP_CONFIG, useFactory: loadConfiguration }],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
