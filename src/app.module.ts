import { Controller, Get, Module } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { FoursquareModule } from './foursquare/foursquare.module';
import { GoogleModule } from './google/google.module';

/** Mismo mensaje que la raíz de la versión FastAPI. */
@ApiExcludeController()
@Controller()
class RootController {
  @Get()
  root(): { message: string } {
    return { message: 'Bienvenido a la API de Turismo v2' };
  }
}

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    CacheModule,
    FoursquareModule,
    GoogleModule,
  ],
  controllers: [RootController],
})
export class AppModule {}
