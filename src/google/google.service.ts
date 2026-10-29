import { Injectable } from '@nestjs/common';
import { GoogleRepository } from './google.repository';
import {   
  ReviewerListResponseDto,
  SiteListResponseDto,
  TipListResponseDto, 
} from './dto/google-response.dto';
import { HeatmapResponseDto, NameListResponseDto } from '../shared/dto/response.dto';
import {  
  toExpandedTip,
  toHeatmapPoint,
  toReviewer,
  toSiteGoogle, 
} from './google.mapper';

/**
 * Servicio de negocio para Foursquare. Compone las respuestas mapeadas a partir del repositorio.
 */
@Injectable()
export class GoogleService {
  constructor(private readonly repository: GoogleRepository) {}

  async getSites(
    departamento: string,
    limit: number,
  ): Promise<SiteListResponseDto> {
    const [docs, total] = await Promise.all([
      this.repository.findSitesByDepartment(departamento, limit, true),
      this.repository.countSitesByDepartment(departamento, true),
    ]);

    return { total, sitios: docs.map(toSiteGoogle) };
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

  /** Sin departamento devuelve todos los municipios. */
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

    return { total: points.length, points };
  }
}
