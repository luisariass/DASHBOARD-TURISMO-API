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
    clean: bool = False
) -> List[dict]:
    collection = "sities_clean" if clean else "sities_full"
    query = {"departamento": departamento}
    cursor = db[collection].find(query).limit(limit)
    return await _fetch_documents(cursor)

async def count_sites(db: AsyncIOMotorDatabase, departamento: str, clean: bool = False) -> int:
    collection = "sities_clean" if clean else "sities_full"
    return await db[collection].count_documents({"departamento": departamento})

async def get_distinct_field(db: AsyncIOMotorDatabase, field: str) -> List[str]:
    """Obtiene valores únicos para un campo (categoría o municipio)."""
    return await db["sities_clean"].distinct(field)