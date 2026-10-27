import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { APP_CONFIG, loadConfiguration } from './configuration';

/**
 * Módulo global de configuración. Carga y valida variables de entorno al iniciar.
 */
@Global()
@Module({
  imports: [NestConfigModule.forRoot({ envFilePath: '.env' })],
  providers: [{ provide: APP_CONFIG, useFactory: loadConfiguration }],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
