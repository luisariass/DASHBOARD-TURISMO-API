import { Module } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { GoogleService } from './google.service';
import { GoogleRepository } from './google.repository';

@Module({
  controllers: [GoogleController],
  providers: [GoogleService, GoogleRepository],
})
export class GoogleModule {}
