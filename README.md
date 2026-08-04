# Dashboard Turismo — API

API de consulta para el dashboard de turismo del Caribe colombiano. Expone
datos de sitios, reseñantes y tips recolectados de Foursquare y Google,
almacenados en MongoDB Atlas, con caché en Redis.

Actualmente en **FastAPI**; en migración a **NestJS** (ver [Migración](#migración-a-nestjs)).

El frontend vive en un repo aparte:
[DASHBOARD-TURISMO-WEB](https://github.com/luisariass/DASHBOARD-TURISMO-WEB).

## Requisitos

- Python 3.11+
- Acceso a un cluster de MongoDB Atlas
- Redis (opcional en local: si no está disponible la API funciona sin caché)

## Arranque local

```bash
python -m venv venv
source venv/Scripts/activate      # en Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # y rellena los valores
uvicorn app.main:app --reload
```

Disponible en `http://localhost:8000`. Documentación interactiva en
`http://localhost:8000/docs`.

## Arranque con Docker

La red `dashboard_net` es compartida con el repo web, así que su Nginx puede
hacer proxy a este servicio. Se crea una sola vez:

```bash
docker network create dashboard_net
docker compose up --build
```

## Variables de entorno

Ver [`.env.example`](.env.example). `MONGODB_URI`, las dos `MONGODB_DATABASE_*`,
`REDIS_URL` y `BACKEND_CORS_ORIGINS` son obligatorias: la API no arranca si
falta alguna (las valida Pydantic al iniciar).

## Endpoints

Prefijo `/foursquare`:

| Ruta | Query | Respuesta |
|---|---|---|
| `GET /sities` | `departamento` (req.), `limit` (≤1000) | `{ total, sitios[] }` |
| `GET /reviewers` | `departamento` (req.), `limit` | `{ total, reseñantes[] }` |
| `GET /tips` | `departamento` (req.), `limit` | `{ total_tips, tips[] }` |
| `GET /categorias` | — | `{ total, nombres[] }` |
| `GET /municipios` | `departamento` (opc.) | `{ total, nombres[] }` |
| `GET /heatmap` | `departamento` (req.), `municipio` (opc.) | `{ total, points[] }` |

Prefijo `/google`:

| Ruta | Query | Respuesta |
|---|---|---|
| `GET /sities_clean` | `departamento` (req.), `limit` | `{ total, sitios[] }` |
| `GET /sities_full` | `departamento` (req.), `limit` | `{ total, sitios[] }` |
| `GET /categorias` | — | `{ total, nombres[] }` |
| `GET /municipios` | — | `{ total, nombres[] }` |

Las claves de respuesta son parte del contrato con el frontend y deben
preservarse literalmente, incluido `_id` y `reseñantes`.

## Estructura

```
app/
├─ main.py              # arranque, CORS, registro de routers
├─ core/
│  ├─ config.py         # settings validadas con Pydantic
│  ├─ database.py       # cliente Mongo y las dos bases de datos
│  └─ cache.py          # decorador de caché sobre Redis
├─ models/schemas.py    # modelos de request y response
├─ api/routers/         # capa HTTP
└─ services/            # consultas y pipelines de agregación
```

## Deuda conocida

- **El caché devuelve datos cruzados entre departamentos.**
  `core/cache.py:_generate_cache_key` construye la clave solo a partir de
  `**kwargs`, pero los routers llaman a los services con argumentos
  posicionales, así que `departamento` no entra en la clave. Durante el TTL,
  consultar un departamento devuelve los datos del anterior. En
  `get_heatmap_points` todos los parámetros son posicionales y comparten una
  única entrada. Se corrige en la migración a Nest, derivando la clave del DTO
  completo.
- `core/cache.py` usa el cliente **sincrónico** de `redis` dentro de funciones
  `async`, bloqueando el event loop en cada operación de caché.

## Migración a NestJS

Planificada por endpoint, con FastAPI y Nest corriendo en paralelo (`:8000` y
`:8001`) y comparando el JSON de ambos antes de cortar. Se usará el driver
nativo `mongodb` en lugar de Mongoose: los datos son scrapeados y sin esquema
fijo, todas las lecturas son agregaciones o `find` con projection, y no hay
escrituras. Al comparar respuestas, hacerlo con Redis apagado por la deuda del
caché descrita arriba.
