import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GoogleService } from './google.service';
import { CacheTtl } from '../cache/cache-ttl.decorator';
import { HttpCacheInterceptor } from '../cache/http-cache.interceptor';
import { SitesQueryDto } from '../shared/dto/query.dto';
import { NameListResponseDto } from '../shared/dto/response.dto';
import { GoogleListResponseDto } from './dto/google-response.dto';

/**
 * Equivale a app/api/routers/google.py, con las mismas rutas.
 *
 * Aquí sí hay un cambio de comportamiento deliberado: en la versión FastAPI este
 * módulo no tenía ningún caché, no por decisión sino porque el copy-paste desde
 * Foursquare se desincronizó. Ahora se cachea con los mismos TTL. Al comparar
 * respuestas con FastAPI hay que hacerlo con CACHE_ENABLED=false, que es la
 * recomendación general de todos modos.
 */
@ApiTags('Google')
@Controller('google')
@UseInterceptors(HttpCacheInterceptor)
export class GoogleController {
  constructor(private readonly service: GoogleService) {}

  @Get('sities_clean')
  @CacheTtl(600)
  @ApiOkResponse({ type: GoogleListResponseDto })
  readSitesClean(
    @Query() query: SitesQueryDto,
  ): Promise<GoogleListResponseDto> {
    return this.service.getSites(query.departamento, query.limit, true);
  }

  @Get('sities_full')
  @CacheTtl(600)
  @ApiOkResponse({ type: GoogleListResponseDto })
  readSitesFull(@Query() query: SitesQueryDto): Promise<GoogleListResponseDto> {
    return this.service.getSites(query.departamento, query.limit, false);
  }

  @Get('categorias')
  @CacheTtl(600)
  @ApiOkResponse({ type: NameListResponseDto })
  readCategories(): Promise<NameListResponseDto> {
    return this.service.getCategories();
  }

  @Get('municipios')
  @CacheTtl(600)
  @ApiOkResponse({ type: NameListResponseDto })
  readMunicipalities(): Promise<NameListResponseDto> {
    return this.service.getMunicipalities();
  }
}
