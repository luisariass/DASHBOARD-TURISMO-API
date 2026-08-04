import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { APP_CONFIG, AppConfig } from './config/configuration';

/**
 * Equivale a app/main.py. El lifespan de FastAPI no tiene traducción directa
 * porque en Nest cada módulo gestiona su propio ciclo de vida: DatabaseModule y
 * CacheModule cierran sus conexiones en onApplicationShutdown, y para que esos
 * hooks se ejecuten hace falta enableShutdownHooks().
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get<AppConfig>(APP_CONFIG);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // Descarta parámetros no declarados en el DTO en vez de pasarlos al
      // handler, igual que FastAPI ignora los query params que no declara.
      whitelist: true,
      transformOptions: { enableImplicitConversion: false },
      // FastAPI responde 422 a un parámetro inválido; Nest usa 400 por defecto.
      // Se alinea para no cambiar el contrato de errores.
      errorHttpStatusCode: 422,
    }),
  );

  app.enableCors({
    origin: config.backendCorsOrigins,
    credentials: true,
    methods: '*',
    allowedHeaders: '*',
  });

  // El openapi.json es lo que después consumirá openapi-typescript para generar
  // los tipos del frontend, en vez de mantenerlos a mano.
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(config.projectName)
      .setDescription(
        'API de consulta del dashboard de turismo del Caribe colombiano',
      )
      .setVersion('2.0')
      .build(),
  );
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'api/v1/openapi.json',
  });

  app.enableShutdownHooks();

  await app.listen(config.port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`${config.projectName} escuchando en el puerto ${config.port}`);
  logger.log(`Caché ${config.cacheEnabled ? 'activado' : 'desactivado'}`);
}

void bootstrap();
