# Dashboard Turismo — API (NestJS)

API de consulta para el dashboard de turismo del Caribe colombiano. Expone
datos de sitios, reseñantes y tips recolectados de Foursquare y Google,
almacenados en MongoDB Atlas, con caché en Redis.

Construida con **NestJS** y **TypeScript**.

El frontend vive en un repositorio aparte:
[DASHBOARD-TURISMO-WEB](https://github.com/luisariass/DASHBOARD-TURISMO-WEB).

## Requisitos

- Node.js 20+
- [pnpm](https://pnpm.io/) (o npm / yarn)
- Acceso a un clúster de MongoDB Atlas
- Redis (opcional en local: si no está disponible, la API funciona sin caché o configurando `CACHE_ENABLED=false`)

## Arranque local

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env     # y completa los valores si no existen

# 3. Iniciar en modo desarrollo
pnpm run start:dev
```

Disponible en `http://localhost:8000`.

- **Documentación interactiva (Swagger UI):** `http://localhost:8000/docs`
- **Esquema OpenAPI en JSON:** `http://localhost:8000/api/v1/openapi.json`

## Arranque con Docker

La red `dashboard_net` es compartida con el frontend, de modo que su Nginx puede
hacer proxy a `http://api:8000`. Se crea una sola vez:

```bash
docker network create dashboard_net
docker compose up --build
```

## Variables de entorno

Consulta [`.env.example`](.env.example). Las variables principales son:

- `MONGODB_URI`: Cadena de conexión al clúster de MongoDB Atlas.
- `MONGODB_DATABASE_FOURSQUARE`: Nombre de la base de datos de Foursquare.
- `MONGODB_DATABASE_GOOGLE`: Nombre de la base de datos de Google.
- `REDIS_URL`: URL del servidor Redis (ej. `redis://localhost:6379`).
- `BACKEND_CORS_ORIGINS`: Lista JSON o separada por comas de orígenes permitidos.
- `PORT`: Puerto en el que escucha la API (por defecto: `8000`).
- `CACHE_ENABLED`: Activa (`true`) o desactiva (`false`) el interceptor de caché.
- `DNS_SERVERS`: Opcional. Útil en Windows si Node no resuelve el registro SRV (`8.8.8.8,1.1.1.1`).

## Endpoints

### Prefijo `/foursquare`

| Ruta | Query | Respuesta |
|---|---|---|
| `GET /sities` | `departamento` (req.), `limit` (≤1000) | `{ total, sitios[] }` |
| `GET /reviewers` | `departamento` (req.), `limit` | `{ total, reseñantes[] }` |
| `GET /tips` | `departamento` (req.), `limit` | `{ total_tips, tips[] }` |
| `GET /categorias` | — | `{ total, nombres[] }` |
| `GET /municipios` | `departamento` (opc.) | `{ total, nombres[] }` |
| `GET /heatmap` | `departamento` (req.), `municipio` (opc.) | `{ total, points[] }` |

### Prefijo `/google`

| Ruta | Query | Respuesta |
|---|---|---|
| `GET /sities_clean` | `departamento` (req.), `limit` | `{ total, sitios[] }` |
| `GET /sities_full` | `departamento` (req.), `limit` | `{ total, sitios[] }` |
| `GET /categorias` | — | `{ total, nombres[] }` |
| `GET /municipios` | — | `{ total, nombres[] }` |

Las claves de respuesta son parte del contrato con el frontend y se preservan
literalmente, incluyendo `_id` y `reseñantes`.

## Estructura del proyecto

```
src/
├─ main.ts                 # Arranque, CORS, ValidationPipe y configuración de Swagger
├─ app.module.ts           # Módulo principal
├─ config/                 # Configuración central y validación de variables de entorno
├─ database/               # Conexión nativa con MongoClient y providers de Db
├─ cache/                  # Conexión asíncrona con ioredis, interceptor y claves de caché
├─ shared/                 # DTOs comunes, mappers y utilidades de MongoDB
├─ foursquare/             # Controller, service, repository y DTOs de Foursquare
└─ google/                 # Controller, service, repository y DTOs de Google
```

## Scripts disponibles

- `pnpm run start:dev`: Arranca la API en modo watch (recarga automática).
- `pnpm run build`: Compila el proyecto TypeScript en la carpeta `dist/`.
- `pnpm run start:prod`: Ejecuta la versión compilada en producción.
- `pnpm run lint`: Valida tipos de TypeScript con `tsc`.
- `pnpm test`: Ejecuta las pruebas unitarias con Jest.
