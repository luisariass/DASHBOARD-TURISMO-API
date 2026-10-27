/**
 * Configuración central de la aplicación.
 * Lee del entorno, valida al arrancar y falla rápido si falta alguna variable obligatoria.
 */
export interface SitesCollectionsConfig {
  readonly clean: string;
  readonly full: string;
}

export interface AppConfig {
  readonly projectName: string;
  readonly port: number;
  readonly mongodbUri: string;
  readonly mongodbDatabaseFoursquare: string;
  readonly mongodbDatabaseGoogle: string;
  readonly redisUrl: string;
  readonly backendCorsOrigins: string[];
  readonly cacheEnabled: boolean;
  /**
   * Servidores DNS a usar en vez de los del sistema. Vacío = los del sistema,
   * que es lo correcto en Docker y en producción. Solo se rellena en máquinas
   * donde Node hereda mal la configuración DNS de Windows y no puede resolver
   * el registro SRV de `mongodb+srv://`. Ver README.
   */
  readonly dnsServers: string[];
  /**
   * Los nombres de colección son configurables por proveedor.
   */
  readonly foursquareCollections: SitesCollectionsConfig;
  readonly googleCollections: SitesCollectionsConfig;
}

/** Variables sin valor por defecto: si falta una, la API no arranca. */
const REQUIRED = [
  'MONGODB_URI',
  'MONGODB_DATABASE_FOURSQUARE',
  'MONGODB_DATABASE_GOOGLE',
  'REDIS_URL',
  'BACKEND_CORS_ORIGINS',
] as const;

/**
 * BACKEND_CORS_ORIGINS viene como lista JSON: '["http://localhost:5173", "http://localhost:3000"]'.
 * Se acepta también una lista separada por comas.
 */
function parseCorsOrigins(raw: string): string[] {
  const trimmed = raw.trim().replace(/^'|'$/g, '');
  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      throw new Error('BACKEND_CORS_ORIGINS debe ser una lista JSON');
    }
    return parsed.map(String);
  }
  return trimmed
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * dns.setServers() lanza si recibe algo que no sea una IP, y lo haría en mitad
 * del arranque del módulo de base de datos. Se valida aquí para que el error
 * salga junto al resto de la configuración.
 */
function parseDnsServers(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  const servers = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // Acepta IPv4, IPv6 y el sufijo de puerto que admite setServers ("1.2.3.4:53",
  // "[::1]:53"), pero no nombres de host.
  const invalid = servers.filter((s) => !/^[0-9a-fA-F:.[\]]+$/.test(s));
  if (invalid.length > 0) {
    throw new Error(
      `DNS_SERVERS solo acepta direcciones IP, no nombres de host: ${invalid.join(', ')}`,
    );
  }
  return servers;
}

export function loadConfiguration(): AppConfig {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}. ` +
        'Copia .env.example a .env y rellena los valores.',
    );
  }

  let backendCorsOrigins: string[];
  try {
    backendCorsOrigins = parseCorsOrigins(process.env.BACKEND_CORS_ORIGINS!);
  } catch (error) {
    throw new Error(
      `BACKEND_CORS_ORIGINS no es válido: ${(error as Error).message}`,
    );
  }

  return {
    projectName: process.env.PROJECT_NAME ?? 'Dashboard Turismo API',
    port: Number(process.env.PORT ?? 8000),
    mongodbUri: process.env.MONGODB_URI!,
    mongodbDatabaseFoursquare: process.env.MONGODB_DATABASE_FOURSQUARE!,
    mongodbDatabaseGoogle: process.env.MONGODB_DATABASE_GOOGLE!,
    redisUrl: process.env.REDIS_URL!,
    backendCorsOrigins,
    cacheEnabled: process.env.CACHE_ENABLED !== 'false',
    dnsServers: parseDnsServers(process.env.DNS_SERVERS),
    foursquareCollections: {
      clean: process.env.FOURSQUARE_COLLECTION_CLEAN ?? 'sities_clean',
      full: process.env.FOURSQUARE_COLLECTION_FULL ?? 'sities_full',
    },
    googleCollections: {
      clean: process.env.GOOGLE_COLLECTION_CLEAN ?? 'sities',
      full: process.env.GOOGLE_COLLECTION_FULL ?? 'sities_full',
    },
  };
}

export const APP_CONFIG = 'APP_CONFIG';
