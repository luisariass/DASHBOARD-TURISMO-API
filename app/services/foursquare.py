from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from app.core.cache import cached  # <-- Importar el decorador

async def _fetch_documents(cursor) -> List[dict]:
    """Helper para convertir cursor a lista y serializar _id."""
    docs = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        docs.append(doc)
    return docs

@cached(prefix="fsq_sites_clean", ttl_seconds=600)  # 10 minutos
async def get_sites_by_department(
    db: AsyncIOMotorDatabase, 
    departamento: str, 
    limit: int,
    clean: bool = True
) -> List[dict]:
    collection = "sities_clean" if clean else "sities_full"
    query = {"departamento": departamento}
    cursor = db[collection].find(query).limit(limit)
    return await _fetch_documents(cursor)

async def count_sites(db: AsyncIOMotorDatabase, departamento: str, clean: bool = True) -> int:
    collection = "sities_clean" if clean else "sities_full"
    return await db[collection].count_documents({"departamento": departamento})

@cached(prefix="fsq_reviewers", ttl_seconds=600)
async def get_reviewers_by_department(
    db: AsyncIOMotorDatabase,
    departamento: str,
    limit: int,
    full: bool = False
) -> List[dict]:
    collection = "reviewers_full" if full else "reviewers"
    query = {"departamento": departamento}
    cursor = db[collection].find(query).limit(limit)
    return await _fetch_documents(cursor)

async def count_reviewers(db: AsyncIOMotorDatabase, departamento: str, full: bool = False) -> int:
    collection = "reviewers_full" if full else "reviewers"
    return await db[collection].count_documents({"departamento": departamento})

@cached(prefix="fsq_tips", ttl_seconds=600)
async def get_expanded_tips_by_department(db: AsyncIOMotorDatabase, departamento: str, limit: int) -> List[dict]:
    """
    Obtiene los tips expandidos usando un pipeline de agregación que coincide con la estructura original.
    """
    pipeline = [
        {
            "$match": {
                "departamento": {"$regex": departamento, "$options": "i"}
            }
        },
        {"$unwind": "$tips"},  # Explota el array
        {
            "$project": {
                "_id": 0, # Excluimos el _id
                "user_name": 1,
                "municipio": 1,
                "departamento": 1,
                "tip": "$tips", # Proyectamos el objeto 'tips' completo como 'tip'
            }
        },
        {"$limit": limit}
    ]

    cursor = db["tips"].aggregate(pipeline)
    return await cursor.to_list(length=None)

async def count_expanded_tips(db: AsyncIOMotorDatabase, departamento: str) -> int:
    """
    Cuenta el número total de tips después de expandir el array.
    """
    pipeline = [
        {"$match": {"departamento": {"$regex": departamento, "$options": "i"}}},
        {"$unwind": "$tips"},
        {"$count": "total_tips"}
    ]
    
    result = await db["tips"].aggregate(pipeline).to_list(length=1)
    return result[0]["total_tips"] if result else 0

async def get_distinct_field(db: AsyncIOMotorDatabase, field: str) -> List[str]:
    """Obtiene valores únicos para un campo (categoría o municipio)."""
    pipeline = [
        {"$match": {field: {"$ne": None}}},
        {"$group": {"_id": f"${field}"}},
        {"$sort": {"_id": 1}}
    ]
    cursor = db["sities_clean"].aggregate(pipeline)
    return [doc["_id"] async for doc in cursor]

async def get_municipalities_by_department(db: AsyncIOMotorDatabase, departamento: str) -> List[str]:
    """Obtiene la lista de municipios filtrada por departamento."""
    pipeline = [
        {"$match": {
            "departamento": {"$regex": departamento, "$options": "i"},
            "municipio": {"$ne": None}
        }},
        {"$group": {"_id": "$municipio"}},
        {"$sort": {"_id": 1}}
    ]
    cursor = db["sities_clean"].aggregate(pipeline)
    return [doc["_id"] async for doc in cursor]

@cached(prefix="fsq_heatmap", ttl_seconds=900)  # 15 minutos
async def get_heatmap_points(
    db: AsyncIOMotorDatabase, 
    departamento: str, 
    municipio: Optional[str] = None
) -> List[dict]:
    """
    Obtiene una lista de coordenadas y pesos para el mapa de calor.
    Permite filtrar opcionalmente por municipio.
    """
    query = {
        "departamento": {"$regex": departamento, "$options": "i"},
        "latitude": {"$exists": True, "$ne": None},
        "longitude": {"$exists": True, "$ne": None}
    }
    
    if municipio:
        query["municipio"] = {"$regex": municipio, "$options": "i"}

    projection = {"latitude": 1, "longitude": 1, "_id": 0}
    
    cursor = db["sities_clean"].find(query, projection)
    
    points = []
    async for doc in cursor:
        points.append({
            "latitude": doc["latitude"],
            "longitude": doc["longitude"],
        })
    return points