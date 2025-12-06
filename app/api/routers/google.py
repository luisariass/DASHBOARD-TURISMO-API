from fastapi import APIRouter, Depends, Query
from app.core.database import get_db_google
from app.services import google as service
from app.models.schemas import GoogleListResponse, NameListResponse

router = APIRouter()

@router.get("/sities_clean", response_model=GoogleListResponse)
async def read_google_sites_clean(
    departamento: str = Query(..., min_length=2),
    limit: int = Query(100, le=1000),
    db = Depends(get_db_google)
):
    sites = await service.get_sites_by_department(db, departamento, limit, clean=True)
    total = await service.count_sites(db, departamento, clean=True)
    return {"total": total, "sitios": sites}

@router.get("/sities_full", response_model=GoogleListResponse)
async def read_google_sites_full(
    departamento: str = Query(..., min_length=2),
    limit: int = Query(100, le=1000),
    db = Depends(get_db_google)
):
    sites = await service.get_sites_by_department(db, departamento, limit, clean=False)
    total = await service.count_sites(db, departamento, clean=False)
    return {"total": total, "sitios": sites}

@router.get("/categorias", response_model=NameListResponse)
async def read_google_categories(db = Depends(get_db_google)):
    names = await service.get_distinct_field(db, "categoria")
    return {"total": len(names), "nombres": names}

@router.get("/municipios", response_model=NameListResponse)
async def read_google_municipalities(db = Depends(get_db_google)):
    names = await service.get_distinct_field(db, "municipio")
    return {"total": len(names), "nombres": names}