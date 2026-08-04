import { Module } from '@nestjs/common';
import { FoursquareController } from './foursquare.controller';
import { FoursquareService } from './foursquare.service';
import { FoursquareRepository } from './foursquare.repository';

/**
 * Módulo vertical: controller, service y repositorio del proveedor viven juntos.
 * Añadir un proveedor nuevo es añadir una carpeta como esta, sin tocar las demás.
 */
@Module({
  controllers: [FoursquareController],
  providers: [FoursquareService, FoursquareRepository],
})
export class FoursquareModule {}
