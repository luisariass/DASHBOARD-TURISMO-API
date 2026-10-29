import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GoogleService } from './google.service';
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
} from './dto/google-response.dto';

/**
 * Controlador de endpoints para los datos de Google.
 * Rutas declaradas con soporte para caché HTTP (600s de TTL).
 */
@ApiTags('Google')
@Controller('google')
@UseInterceptors(HttpCacheInterceptor)
export class GoogleController {
  constructor(private readonly service: GoogleService) {}

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