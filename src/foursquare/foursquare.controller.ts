import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FoursquareService } from './foursquare.service';
import { CacheTtl } from '../cache/cache-ttl.decorator';
import { HttpCacheInterceptor } from '../cache/http-cache.interceptor';
import {
  HeatmapQueryDto,
  OptionalDepartamentoQueryDto,
  SitesQueryDto,
} from '../shared/dto/query.dto';
import {
  HeatmapResponseDto,
  NameListResponseDto,
} from '../shared/dto/response.dto';
import {
  ReviewerListResponseDto,
  SiteListResponseDto,
  TipListResponseDto,
} from './dto/foursquare-response.dto';

/**
 * Equivale a app/api/routers/foursquare.py. Las rutas se mantienen idénticas,
 * incluido el typo `sities`: forma parte del contrato con el frontend y
 * cambiarlo es una decisión aparte, no un efecto colateral de la migración.
 *
 * Los TTL son los mismos que tenían los decoradores @cached de la versión
 * Python: 600 segundos en los listados y 900 en el heatmap.
 */
@ApiTags('Foursquare')
@Controller('foursquare')
@UseInterceptors(HttpCacheInterceptor)
export class FoursquareController {
  constructor(private readonly service: FoursquareService) {}

  @Get('sities')
  @CacheTtl(600)
  @ApiOkResponse({ type: SiteListResponseDto })
  readSitesClean(@Query() query: SitesQueryDto): Promise<SiteListResponseDto> {
    return this.service.getSites(query.departamento, query.limit);
  }

  @Get('reviewers')
  @CacheTtl(600)
  @ApiOkResponse({ type: ReviewerListResponseDto })
  readReviewers(
    @Query() query: SitesQueryDto,
  ): Promise<ReviewerListResponseDto> {
    return this.service.getReviewers(query.departamento, query.limit);
  }

  @Get('tips')
  @CacheTtl(600)
  @ApiOkResponse({ type: TipListResponseDto })
  readExpandedTips(
    @Query() query: SitesQueryDto,
  ): Promise<TipListResponseDto> {
    return this.service.getExpandedTips(query.departamento, query.limit);
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
  readMunicipalities(
    @Query() query: OptionalDepartamentoQueryDto,
  ): Promise<NameListResponseDto> {
    return this.service.getMunicipalities(query.departamento);
  }

  @Get('heatmap')
  @CacheTtl(900)
  @ApiOkResponse({ type: HeatmapResponseDto })
  readHeatmapPoints(
    @Query() query: HeatmapQueryDto,
  ): Promise<HeatmapResponseDto> {
    return this.service.getHeatmapPoints(query.departamento, query.municipio);
  }
}
