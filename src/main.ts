import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { APP_CONFIG, AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get<AppConfig>(APP_CONFIG);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: false },
      errorHttpStatusCode: 422,
    }),
  );

  app.enableCors({
    origin: config.backendCorsOrigins,
    credentials: true,
    methods: '*',
    allowedHeaders: '*',
  });

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
