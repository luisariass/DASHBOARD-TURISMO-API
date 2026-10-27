import { Db, Document } from 'mongodb';

/**
 * Define las colecciones utilizadas por un proveedor de sitios.
 */
export interface SitesCollections {
  readonly clean: string;
  readonly full: string;
}

/**
 * Base abstracta de los repositorios de sitios turísticos en MongoDB.
 * Ofrece operaciones estándar para consulta y conteo de sitios filtrados por departamento.
 */
export abstract class BaseSitesRepository {
  protected constructor(
    protected readonly db: Db,
    protected readonly collections: SitesCollections,
  ) {}

  protected collectionFor(clean: boolean): string {
    return clean ? this.collections.clean : this.collections.full;
  }

  async findSitesByDepartment(
    departamento: string,
    limit: number,
    clean: boolean,
  ): Promise<Document[]> {
    return this.db
      .collection(this.collectionFor(clean))
      .find({ departamento })
      .limit(limit)
      .toArray();
  }

  async countSitesByDepartment(
    departamento: string,
    clean: boolean,
  ): Promise<number> {
    return this.db
      .collection(this.collectionFor(clean))
      .countDocuments({ departamento });
  }

  /**
   * Valores únicos de un campo ordenados ascendentemente, descartando nulos.
   */
  async distinctField(field: string): Promise<string[]> {
    const docs = await this.db
      .collection(this.collections.clean)
      .aggregate([
        { $match: { [field]: { $ne: null } } },
        { $group: { _id: `$${field}` } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    return docs.map((doc) => doc._id as string);
  }
}
