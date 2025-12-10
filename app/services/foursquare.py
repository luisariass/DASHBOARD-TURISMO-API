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
    collection = "reviewers_full" if full else "reviewers"
    query = {"departamento": departamento}
    cursor = db[collection].find(query).limit(limit)
    return await _fetch_documents(cursor)

async def count_reviewers(db: AsyncIOMotorDatabase, departamento: str, full: bool = False) -> int:
    collection = "reviewers_full" if full else "reviewers"
    return await db[collection].count_documents({"departamento": departamento})

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