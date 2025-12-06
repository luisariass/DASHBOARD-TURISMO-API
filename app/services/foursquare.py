from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

async def _fetch_documents(cursor) -> List[dict]:
    """Helper para convertir cursor a lista y serializar _id."""
    docs = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        docs.append(doc)
    return docs

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

async def get_reviewers_by_department(
    db: AsyncIOMotorDatabase,
    departamento: str,
    limit: int,
    full: bool = False
) -> List[dict]:
    collection = "reseñantes_full" if full else "reseñantes"
    query = {"departamento": departamento}
    cursor = db[collection].find(query).limit(limit)
    return await _fetch_documents(cursor)

async def count_reviewers(db: AsyncIOMotorDatabase, departamento: str, full: bool = False) -> int:
    collection = "reseñantes_full" if full else "reseñantes"
    return await db[collection].count_documents({"departamento": departamento})

async def get_tips_by_department(db: AsyncIOMotorDatabase, departamento: str, limit: int) -> List[dict]:
    query = {"departamento": departamento}
    cursor = db["tips_expand"].find(query).limit(limit)
    return await _fetch_documents(cursor)

async def count_tips(db: AsyncIOMotorDatabase, departamento: str) -> int:
    return await db["tips_expand"].count_documents({"departamento": departamento})

async def get_distinct_field(db: AsyncIOMotorDatabase, field: str) -> List[str]:
    """Obtiene valores únicos para un campo (categoría o municipio)."""
    pipeline = [
        {"$match": {field: {"$ne": None}}},
        {"$group": {"_id": f"${field}"}},
        {"$sort": {"_id": 1}}
    ]
    cursor = db["sities_clean"].aggregate(pipeline)
    return [doc["_id"] async for doc in cursor]