import { Inject, Injectable } from '@nestjs/common';
import { Db, Document } from 'mongodb';
import { DB_FOURSQUARE } from '../database/database.constants';
import { BaseSitesRepository } from '../shared/repository/base-sites.repository';
import { insensitiveRegex } from '../shared/mongo.util';
import { APP_CONFIG, AppConfig } from '../config/configuration';

/**
 * Repositorio de acceso a datos para las colecciones de Foursquare en MongoDB.
 */
@Injectable()
export class FoursquareRepository extends BaseSitesRepository {
  constructor(
    @Inject(DB_FOURSQUARE) db: Db,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    super(db, config.foursquareCollections);
  }

  async findReviewersByDepartment(
    departamento: string,
    limit: number,
    full = false,
  ): Promise<Document[]> {
    const collection = full ? 'reviewers_full' : 'reviewers';
    return this.db
      .collection(collection)
      .find({ departamento })
      .limit(limit)
      .toArray();
  }

  async countReviewersByDepartment(
    departamento: string,
    full = false,
  ): Promise<number> {
    const collection = full ? 'reviewers_full' : 'reviewers';
    return this.db
      .collection(collection)
      .countDocuments({ departamento });
  }

  async findExpandedTipsByDepartment(
    departamento: string,
    limit: number,
  ): Promise<Document[]> {
    return this.db
      .collection('tips')
      .aggregate([
        { $match: { departamento: insensitiveRegex(departamento) } },
        { $unwind: '$tips' },
        {
          $project: {
            user_name: 1,
            municipio: 1,
            departamento: 1,
            tip: '$tips',
          },
        },
        { $limit: limit },
      ])
      .toArray();
  }

  async countExpandedTipsByDepartment(departamento: string): Promise<number> {
    const result = await this.db
      .collection('tips')
      .aggregate([
        { $match: { departamento: insensitiveRegex(departamento) } },
        { $unwind: '$tips' },
        { $count: 'total_tips' },
      ])
      .toArray();

    return result.length > 0 ? (result[0].total_tips as number) : 0;
  }

  /** Municipios de un departamento concreto. */
  async findMunicipalitiesByDepartment(
    departamento: string,
  ): Promise<string[]> {
    const docs = await this.db
      .collection(this.collections.clean)
      .aggregate([
        {
          $match: {
            departamento: insensitiveRegex(departamento),
            municipio: { $ne: null },
          },
        },
        { $group: { _id: '$municipio' } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    return docs.map((doc) => doc._id as string);
  }

  /**
   * Puntos del mapa de calor y marcadores de sitios.
   * Proyecta coordenadas y metadata de los sitios turísticos.
   */
  async findHeatmapPoints(
    departamento: string,
    municipio?: string,
  ): Promise<Document[]> {
    const query: Document = {
      departamento: insensitiveRegex(departamento),
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
    };

    if (municipio) {
      query.municipio = insensitiveRegex(municipio);
    }

    return this.db
      .collection(this.collections.clean)
      .find(query)
      .project({
        latitude: 1,
        longitude: 1,
        nombre: 1,
        categoria: 1,
        puntuacion: 1,
        _id: 1,
      })
      .toArray();
  }
}
