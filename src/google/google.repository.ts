import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { DB_GOOGLE } from '../database/database.constants';
import { BaseSitesRepository } from '../shared/repository/base-sites.repository';
import { APP_CONFIG, AppConfig } from '../config/configuration';

/**
 * Traducción de app/services/google.py. Casi todo lo hereda de la base: en la
 * versión Python este archivo repetía _fetch_documents, get_sites_by_department
 * y count_sites literalmente iguales a los de Foursquare.
 *
 * Solo se sobreescribe distinctField, porque la versión de Google usaba
 * collection.distinct() en vez del pipeline de agregación. Se conserva la
 * diferencia para que la comparación con FastAPI sea válida: distinct() no
 * garantiza orden ni descarta nulos, así que el resultado puede no coincidir con
 * el de Foursquare aunque los datos sean equivalentes.
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
}
