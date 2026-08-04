# Paridad entre FastAPI y NestJS

Registro de la migración: qué coincide, qué cambia a propósito y qué quedó
pendiente de decidir. El objetivo es que el contrato con el frontend no se mueva
sin que sea una decisión consciente.

## Estado de la comparación

Última corrida de `npm run compare` con las dos APIs contra el cluster real y el
caché desactivado en ambas:

```
Idénticas:        46
Solo el orden:     0
Datos distintos:   9   <- todas son el arreglo de Google descrito abajo
Estado distinto:   0
```

Los 6 endpoints que consume el dashboard coinciden byte a byte en los 7
departamentos del Caribe, salvo `/google/sities_clean`, que en FastAPI devuelve
vacío por un bug.

## Cómo reproducir la comparación

```bash
# FastAPI en el 8000, con Redis apagado o vacío
uvicorn app.main:app --port 8000

# Nest en el 8001, sin caché
CACHE_ENABLED=false PORT=8001 npm run start:prod

npm run compare
npm run compare -- --only google          # filtrar por grupo de endpoints
npm run compare -- --dep Bolívar          # un solo departamento
```

El caché **tiene** que estar desactivado en los dos lados. FastAPI tiene un bug
en la clave que sirve datos de otro departamento, así que con Redis de por medio
el diff no significa nada.

## Diferencias deliberadas

### 1. Google apuntaba a colecciones que no existen

Era la causa de "no muestra los datos del cluster de Google en el dashboard".
No era el filtro por departamento: la versión FastAPI consulta `sities_clean` en
las dos bases, pero **la base de Google no tiene esa colección**. Mongo devuelve
vacío para una colección inexistente, sin error, así que el fallo era silencioso.

Colecciones reales en la base de Google (`Googlemaps_Scraping`):
`reviewers`, `sities`, `sities_backup`, `sities_backup_full`, `Tips`.

La colección de sitios se llama `sities` y tiene 25 432 documentos, con los
campos que el modelo espera (`nombre`, `categoria`, `puntuacion`, `municipio`,
`departamento`). Ahora los nombres de colección son configurables por variable
de entorno en vez de estar incrustados, y el valor por defecto de Google es el
correcto. Resultado tras el cambio:

| Endpoint | FastAPI | Nest |
|---|---|---|
| `/google/sities_clean?departamento=Magdalena` | 0 | 6387 |
| `/google/sities_clean?departamento=Cesar` | 0 | 5407 |
| `/google/sities_clean?departamento=Córdoba` | 0 | 3504 |
| `/google/sities_clean?departamento=La Guajira` | 0 | 3397 |
| `/google/sities_clean?departamento=Atlántico` | 0 | 3328 |
| `/google/sities_clean?departamento=Bolívar` | 0 | 1510 |
| `/google/sities_clean?departamento=Sucre` | 0 | 1447 |
| `/google/categorias` | 0 | 8 |
| `/google/municipios` | 0 | 162 |

### 2. El módulo de Google ahora se cachea

En FastAPI `services/google.py` no tenía ningún `@cached`, mientras que
Foursquare sí. No fue una decisión: fue copy-paste que se desincronizó. Ahora
las dos rutas se cachean con los mismos TTL (600 s en listados, 900 s en el
heatmap), declarados de forma explícita con `@CacheTtl` en el controller.

### 3. La clave de caché incluye todos los parámetros

`core/cache.py:_generate_cache_key` derivaba la clave solo de `**kwargs`, pero
los routers llamaban a los services con argumentos posicionales, así que
`departamento` nunca entraba en la clave: durante el TTL, pedir un departamento
devolvía los datos del anterior. En `/heatmap` no llegaba ningún kwarg, así que
el mapa entero compartía una sola entrada.

Ahora el caché vive en un interceptor en la frontera HTTP y la clave se deriva
de la ruta más la query completa, ordenada. Cubierto por
`src/cache/cache-key.spec.ts`.

### 4. Redis dejó de bloquear el event loop

La versión Python usaba el cliente **sincrónico** de `redis` dentro de funciones
`async`. Aquí se usa `ioredis`, asíncrono.

## Detalles de contrato que sí se preservan

- Claves de respuesta literales: `_id` sin normalizar, `sitios`, `reseñantes`
  (con ñ), `nombres`, `total_tips`, `tips`, `points`, `total`.
- El typo `sities` en las rutas: es parte del contrato con el frontend.
  Corregirlo es una decisión aparte, con alias de compatibilidad.
- Filtrado de campos: el `response_model` de FastAPI descartaba cualquier campo
  no declarado en el modelo, así que un documento con 12 campos salía con 8. Los
  mappers replican ese filtrado, y emiten `null` en los campos ausentes en vez
  de omitir la clave.
- Coacción de tipos: Pydantic convierte a float en modo laxo, así que un
  `puntuacion` guardado como texto salía numérico. Se replica.
- Código de error 422 en parámetros inválidos. Nest usa 400 por defecto; se
  alinea con `errorHttpStatusCode` en el `ValidationPipe`.
- `$regex` con `$options: 'i'` donde lo usaba Python, e igualdad exacta donde
  usaba igualdad exacta. Se añade escapado del valor, que faltaba.
- `distinctField` de Google sigue usando `collection.distinct()` en vez del
  pipeline de agregación que usa Foursquare, porque así era en Python. No
  garantiza orden ni descarta nulos.

## Pendiente de decidir (verificado, no cambiado)

Nada de esto se ha tocado: son decisiones de producto o de datos, no de
migración.

1. **`sities_full` no existe en ninguna de las dos bases.** `/google/sities_full`
   devuelve vacío y seguirá haciéndolo. Candidatos en la base de Google:
   `sities_backup` (32 553 docs) y `sities_backup_full` (4776 docs, solo 3
   departamentos), pero los dos parecen respaldos y no un dataset "full". Hay que
   decidir a qué apunta o eliminar el endpoint. Se configura con
   `GOOGLE_COLLECTION_FULL`.

2. **`reviewers_full` tampoco existe** en la base de Foursquare. Es una rama
   muerta: ningún endpoint pasa `full=True`.

3. **`rating` siempre sale `null` en Foursquare.** La colección
   `foursquare_scraping.sities_clean` (9797 docs) guarda el campo como
   `puntuacion`, no como `rating`, pero el modelo `SiteFoursquare` declara
   `rating`. El `response_model` descarta `puntuacion` y emite `rating: null`.
   Arreglarlo cambia la forma de la respuesta, así que es una decisión de
   contrato: renombrar en el modelo, o exponer los dos campos.

4. **San Andrés no coincide entre proveedores.** El frontend envía
   `Archipiélago De San Andrés Providencia Y Santa Catalina`, que es exactamente
   lo que guarda Foursquare, pero Google lo guarda como
   `San Andrés y Providencia`. Ese departamento devolverá 0 en los endpoints de
   Google. Es un problema de normalización en la ingesta.

5. **Los filtros por departamento no pueden usar índices.** El `$regex` no está
   anclado, así que recorre la colección completa. Normalizar el campo al
   guardarlo y comparar por igualdad, con índice sobre `departamento` y
   `municipio`, es la mejora de rendimiento con más retorno.

6. **`countExpandedTips` expande toda la colección solo para contar.**

## Bug del FastAPI actual, encontrado al verificar

En Windows, **la API no arranca si Redis no está disponible**: `core/cache.py`
imprime `"⚠️ Redis no disponible…"` y la consola en cp1252 no puede codificar el
emoji, así que el `UnicodeEncodeError` tumba el startup. Se rodea con
`PYTHONIOENCODING=utf-8`. No se corrige porque ese código se elimina al
completar la migración, pero conviene saberlo si hay que levantar FastAPI para
comparar.

## Nota de entorno

En esta máquina Node ve `127.0.0.1` como único servidor DNS y ese resolver
rechaza las consultas SRV que necesita `mongodb+srv://`, con
`querySrv ECONNREFUSED`. `nslookup` y `curl` funcionan, así que no es falta de
red. Dos salidas: arreglar el resolver local, o pedir a Atlas la cadena de
conexión sin SRV (`mongodb://` con los hosts explícitos). Python no se ve
afectado porque pymongo resuelve con dnspython.
