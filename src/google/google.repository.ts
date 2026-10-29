import { Inject, Injectable } from '@nestjs/common';
import { Db, Document } from 'mongodb';
import { DB_GOOGLE } from '../database/database.constants';
import { BaseSitesRepository } from '../shared/repository/base-sites.repository';
import { insensitiveRegex } from '../shared/mongo.util';
import { APP_CONFIG, AppConfig } from '../config/configuration';

/**
 * Repositorio de acceso a datos para las colecciones de Google en MongoDB.
 */
@Injectable()
export class GoogleRepository extends BaseSitesRepository {
  constructor(
    @Inject(DB_GOOGLE) db: Db,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    super(db, config.googleCollections);
  }

  override async distinctField(field: string): Promise<string[]> {
    const values = await this.db
      .collection(this.collections.clean)
      .distinct(field);

    return values as string[];
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
      //.collection('reviewers')
      .collection('Tips')
      .aggregate([
        { $match: { departamento: insensitiveRegex(departamento) } },
        { $unwind: '$Tips' },
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
      //.collection('reviewers')
      .collection('Tips')
      .aggregate([
        { $match: { departamento: insensitiveRegex(departamento) } },
        { $unwind: '$Tips' },
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
   * Puntos del mapa de calor. Descarta documentos sin coordenadas y proyecta
   * solo latitude y longitude.
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
      .project({ latitude: 1, longitude: 1, _id: 0 })
      .toArray();
  }
}
