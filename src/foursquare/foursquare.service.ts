import { Injectable } from '@nestjs/common';
import { FoursquareRepository } from './foursquare.repository';
import {
  ReviewerListResponseDto,
  SiteListResponseDto,
  TipListResponseDto,
} from './dto/foursquare-response.dto';
import { HeatmapResponseDto, NameListResponseDto } from '../shared/dto/response.dto';
import {
  toExpandedTip,
  toHeatmapPoint,
  toReviewer,
  toSiteFoursquare,
} from './foursquare.mapper';

/**
 * El service compone la respuesta y no sabe nada de Mongo: recibe el repositorio
 * por constructor. En FastAPI el router obtenía el handle de la base con
 * Depends(get_db_foursquare) y se lo pasaba como argumento al service, lo que
 * ataba la firma a AsyncIOMotorDatabase y hacía imposible probarlo sin una base
 * real.
 *
 * Las dos consultas de cada listado (datos y conteo) van en paralelo. En la
 * versión Python eran dos await secuenciales, así que esto es gratis.
 */
@Injectable()
export class FoursquareService {
  constructor(private readonly repository: FoursquareRepository) {}

  async getSites(
    departamento: string,
    limit: number,
  ): Promise<SiteListResponseDto> {
    const [docs, total] = await Promise.all([
      this.repository.findSitesByDepartment(departamento, limit, true),
      this.repository.countSitesByDepartment(departamento, true),
    ]);

    return { total, sitios: docs.map(toSiteFoursquare) };
  }

  async getReviewers(
    departamento: string,
    limit: number,
  ): Promise<ReviewerListResponseDto> {
    const [docs, total] = await Promise.all([
      this.repository.findReviewersByDepartment(departamento, limit),
      this.repository.countReviewersByDepartment(departamento),
    ]);

    return { total, reseñantes: docs.map(toReviewer) };
  }

  async getExpandedTips(
    departamento: string,
    limit: number,
  ): Promise<TipListResponseDto> {
    const [docs, total] = await Promise.all([
      this.repository.findExpandedTipsByDepartment(departamento, limit),
      this.repository.countExpandedTipsByDepartment(departamento),
    ]);

    return { total_tips: total, tips: docs.map(toExpandedTip) };
  }

  async getCategories(): Promise<NameListResponseDto> {
    const nombres = await this.repository.distinctField('categoria');
    return { total: nombres.length, nombres };
  }

  /** Sin departamento devuelve todos los municipios, igual que en FastAPI. */
  async getMunicipalities(departamento?: string): Promise<NameListResponseDto> {
    const nombres = departamento
      ? await this.repository.findMunicipalitiesByDepartment(departamento)
      : await this.repository.distinctField('municipio');

    return { total: nombres.length, nombres };
  }

  async getHeatmapPoints(
    departamento: string,
    municipio?: string,
  ): Promise<HeatmapResponseDto> {
    const docs = await this.repository.findHeatmapPoints(departamento, municipio);
    const points = docs.map(toHeatmapPoint);

    // El total del heatmap es el número de puntos devueltos, no un count
    // independiente en la base.
    return { total: points.length, points };
  }
}
