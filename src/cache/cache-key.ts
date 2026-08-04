import { createHash } from 'node:crypto';

/**
 * Construye la clave de caché a partir de la ruta y de TODOS los parámetros de
 * la petición, ordenados para que el orden en la URL no genere claves distintas.
 *
 * Esto es la corrección del bug de app/core/cache.py: allí la clave se derivaba
 * solo de **kwargs, pero los routers llamaban a los services con argumentos
 * posicionales, así que `departamento` nunca entraba en la clave y todos los
 * departamentos compartían la misma entrada. En /heatmap era peor: ningún
 * parámetro llegaba como kwarg, así que el mapa entero tenía una sola entrada.
 *
 * Función pura y exportada a propósito: es la pieza que hay que poder probar
 * sin levantar Redis ni Mongo.
 */
export function buildCacheKey(
  routePath: string,
  query: Record<string, unknown>,
): string {
  const normalized: Record<string, string> = {};
  for (const key of Object.keys(query).sort()) {
    const value = query[key];
    // undefined y null no se distinguen de "ausente" en una query string, así
    // que se omiten para que ?municipio= y la ausencia del parámetro compartan
    // resultado, igual que hace la consulta a Mongo.
    if (value === undefined || value === null || value === '') continue;
    normalized[key] = String(value);
  }

  const digest = createHash('md5')
    .update(JSON.stringify(normalized))
    .digest('hex');

  return `${routePath}:${digest}`;
}
