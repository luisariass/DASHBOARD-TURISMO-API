import { Db, Document } from 'mongodb';

/**
 * Qué colecciones usa un proveedor. Foursquare y Google tienen hoy los mismos
 * nombres, pero el eje de cambio del proyecto es justamente el proveedor
 * (mañana TripAdvisor o Booking), así que se recibe por configuración en vez de
 * quedar incrustado en el código.
 */
export interface SitesCollections {
  readonly clean: string;
  readonly full: string;
}

/**
 * Base compartida de los repositorios de sitios. Existe porque en la versión
 * FastAPI services/foursquare.py y services/google.py repetían _fetch_documents
 * literal y tenían get_sites_by_department, count_sites y get_distinct_field
 * casi idénticas. Esa duplicación fue la que dejó el módulo de Google sin caché
 * por descuido.
 *
 * Es la frontera de repositorio que decidimos adoptar de la hexagonal sin
 * traerse el aparato completo de puertos y adaptadores: los services reciben un
 * repositorio con métodos en términos del dominio y ya no un handle de Db, que
 * es lo que hacía imposible probarlos sin una base real.
 */
export abstract class BaseSitesRepository {
  protected constructor(
    protected readonly db: Db,
    protected readonly collections: SitesCollections,
  ) {}

  protected collectionFor(clean: boolean): string {
    return clean ? this.collections.clean : this.collections.full;
  }

  /**
   * Filtro por igualdad exacta, replicando literalmente lo que hace la versión
   * FastAPI en get_sites_by_department. Ojo: es sensible a mayúsculas y tildes,
   * a diferencia de otras consultas del mismo código que usan $regex. Es la
   * hipótesis principal de por qué el dashboard no muestra los datos de Google.
   * Se conserva tal cual a propósito para que la comparación con FastAPI sea
   * válida; el arreglo va aparte, después de verificar los datos del cluster.
   */
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

  /** El conteo ignora el limit, igual que count_sites en FastAPI. */
  async countSitesByDepartment(
    departamento: string,
    clean: boolean,
  ): Promise<number> {
    return this.db
      .collection(this.collectionFor(clean))
      .countDocuments({ departamento });
  }

  /**
   * Valores únicos de un campo, ordenados. Replica el pipeline de
   * get_distinct_field de Foursquare: descarta nulos, agrupa y ordena.
   * Google lo sobreescribe porque su versión usa collection.distinct().
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
