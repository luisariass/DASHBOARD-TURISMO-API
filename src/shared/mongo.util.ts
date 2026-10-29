import { Document } from 'mongodb';

/**
 * Convierte el ObjectId u otro identificador a string.
 */
export function toStringId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

/**
 * Devuelve el valor o null si es undefined.
 */
export function nullable(value: unknown): unknown {
  return value === undefined ? null : value;
}

/**
 * Convierte valores numéricos o texto numérico a number, o null si es inválido/ausente.
 */
export function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    // Sanitiza 'N/A', 'null', 'none' o cadenas vacías
    if (['', 'n/a', 'null', 'none', 'undefined'].includes(trimmed)) {
      return null;
    }
    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Convierte a string o null si está ausente.
 */
export function toStringOrNull(value: unknown): string | null {
  return value === undefined || value === null ? null : String(value);
}

/**
 * Genera un objeto regex para MongoDB con coincidencia case-insensitive escapando caracteres especiales.
 */
export function insensitiveRegex(value: string): Document {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $regex: escaped, $options: 'i' };
}
