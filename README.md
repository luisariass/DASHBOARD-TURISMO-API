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

En curso en la rama `feat/nest`. Los 10 endpoints están implementados y
verificados contra FastAPI: 46 respuestas idénticas y 9 distintas, y las 9 son el
arreglo del bug de Google. El detalle está en
[`docs/PARIDAD.md`](docs/PARIDAD.md).

Las dos versiones conviven mientras dure la migración: FastAPI en el 8000 y Nest
en el 8001.

```bash
npm install
npm run start:dev                      # Nest en el 8001
npm run build && npm run start:prod
npm test                               # tests de la clave de caché
npm run compare                        # compara las dos APIs endpoint por endpoint
```

Con Docker, el servicio `api-nest` del `docker-compose.yml` levanta esta versión
en el 8001 en paralelo a `api`.

Decisiones de arquitectura aplicadas:

- **Driver nativo `mongodb`, no Mongoose.** Los datos son scrapeados y sin
  esquema fijo, todas las lecturas son agregaciones o `find` con projection y no
  hay escrituras; los schemas de Mongoose descartarían campos desconocidos.
- **Módulos verticales por feature** (`foursquare/`, `google/`, `shared/`), con
  una base de repositorio compartida que recibe las colecciones por
  configuración. Añadir un proveedor es añadir una carpeta.
- **Frontera de repositorio delgada:** los services reciben un repositorio con
  métodos en términos del dominio, no un handle de `Db`. Es lo que hace que se
  puedan probar sin levantar Mongo.
- **Caché en la frontera HTTP**, con la clave derivada de la ruta y la query
  completa. Corrige el bug descrito arriba.
- **Sin lógica de dominio inventada:** no hay capa de entidades ni puertos y
  adaptadores, porque no hay reglas de negocio que aislar.

Estructura:

```
src/
├─ main.ts                 # arranque, CORS, ValidationPipe, Swagger
├─ app.module.ts
├─ config/                 # settings validadas al arrancar
├─ database/               # un MongoClient, dos providers de Db
├─ cache/                  # Redis, interceptor y clave de caché
├─ shared/                 # DTOs de query, mappers y base de repositorios
├─ foursquare/             # controller, service, repository, DTOs
└─ google/
```

El `openapi.json` queda en `/api/v1/openapi.json` y la documentación
interactiva en `/docs`. Ese esquema es el que después consumirá
`openapi-typescript` para generar los tipos del frontend, en vez de mantenerlos
a mano.
