import { Injectable } from '@nestjs/common';
import { GoogleRepository } from './google.repository';
import { GoogleListResponseDto } from './dto/google-response.dto';
import { NameListResponseDto } from '../shared/dto/response.dto';
import { toSiteGoogle } from './google.mapper';

@Injectable()
export class GoogleService {
  constructor(private readonly repository: GoogleRepository) {}

  /**
   * `clean` decide la colección: sities_clean o sities_full. El dashboard solo
   * consume la variante clean.
   */
  async getSites(
    departamento: string,
    limit: number,
    clean: boolean,
  ): Promise<GoogleListResponseDto> {
    const [docs, total] = await Promise.all([
      this.repository.findSitesByDepartment(departamento, limit, clean),
      this.repository.countSitesByDepartment(departamento, clean),
    ]);

    return { total, sitios: docs.map(toSiteGoogle) };
  }

  async getCategories(): Promise<NameListResponseDto> {
    const nombres = await this.repository.distinctField('categoria');
    return { total: nombres.length, nombres };
  }

  /**
   * A diferencia de Foursquare, aquí no se filtra por departamento: el endpoint
   * original no acepta el parámetro.
   */
  async getMunicipalities(): Promise<NameListResponseDto> {
    const nombres = await this.repository.distinctField('municipio');
    return { total: nombres.length, nombres };
  }
}
