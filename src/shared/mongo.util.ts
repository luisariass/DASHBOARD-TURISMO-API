import { Document } from 'mongodb';

/**
 * Equivalente del helper _fetch_documents de los services de FastAPI, que
 * convertía el ObjectId a string antes de serializar.
 */
export function toStringId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

/**
 * Pydantic devolvía null para los campos Optional ausentes, porque
 * response_model_exclude_none es false por defecto en FastAPI. Hay que emitir
 * la clave con null y no omitirla, o el JSON deja de coincidir.
 */
export function nullable(value: unknown): unknown {
  return value === undefined ? null : value;
}

/**
 * Pydantic coacciona a float en modo laxo, así que un rating guardado como
 * "4.5" salía como 4.5 en la respuesta. Los datos son scrapeados y el tipo no
 * está garantizado, así que se replica esa coacción en los campos numéricos.
 */
export function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Igual, para los campos de texto opcionales. */
export function toStringOrNull(value: unknown): string | null {
  return value === undefined || value === null ? null : String(value);
}

/**
 * Los filtros por departamento y municipio usan $regex insensible a
 * mayúsculas, replicando literalmente lo que hacen los pipelines de la versión
 * FastAPI. Hay que escapar el valor: sin esto, un nombre con un carácter
 * especial de regex cambiaría el significado de la consulta.
 *
 * Nota de rendimiento ya anotada como deuda: sin anclar, este regex no puede
 * aprovechar un índice y obliga a recorrer la colección.
 */
export function insensitiveRegex(value: string): Document {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $regex: escaped, $options: 'i' };
}
