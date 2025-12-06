from fastapi import APIRouter, Depends, Query
from app.core.database import get_db_foursquare
from app.services import foursquare as service
from app.models.schemas import SiteListResponse, ReviewerListResponse, TipListResponse, NameListResponse

router = APIRouter()

@router.get("/sities_clean", response_model=SiteListResponse)
async def read_sites_clean(
    departamento: str = Query(..., min_length=2),
    limit: int = Query(100, le=1000),
    db = Depends(get_db_foursquare)
):
    sites = await service.get_sites_by_department(db, departamento, limit, clean=True)
    total = await service.count_sites(db, departamento, clean=True)
    return {"total": total, "sitios": sites}

@router.get("/sities_full", response_model=SiteListResponse)
async def read_sites_full(
    departamento: str = Query(..., min_length=2),
    limit: int = Query(100, le=1000),
    db = Depends(get_db_foursquare)
):
    sites = await service.get_sites_by_department(db, departamento, limit, clean=False)
    total = await service.count_sites(db, departamento, clean=False)
    return {"total": total, "sitios": sites}

@router.get("/reseñantes", response_model=ReviewerListResponse)
async def read_reviewers(
    departamento: str = Query(..., min_length=2),
    limit: int = Query(100, le=1000),
    db = Depends(get_db_foursquare)
):
    reviewers = await service.get_reviewers_by_department(db, departamento, limit, full=False)
    total = await service.count_reviewers(db, departamento, full=False)
    return {"total": total, "reseñantes": reviewers}

@router.get("/reseñantes_full", response_model=ReviewerListResponse)
async def read_reviewers_full(
    departamento: str = Query(..., min_length=2),
    limit: int = Query(100, le=1000),
    db = Depends(get_db_foursquare)
):
    reviewers = await service.get_reviewers_by_department(db, departamento, limit, full=True)
    total = await service.count_reviewers(db, departamento, full=True)
    return {"total": total, "reseñantes": reviewers}

@router.get("/tips_expand", response_model=TipListResponse)
async def read_tips(
    departamento: str = Query(..., min_length=2),
    limit: int = Query(100, le=1000),
    db = Depends(get_db_foursquare)
):
    tips = await service.get_tips_by_department(db, departamento, limit)
    total = await service.count_tips(db, departamento)
    return {"total_tips": total, "tips": tips}

@router.get("/categorias", response_model=NameListResponse)
async def read_categories(db = Depends(get_db_foursquare)):
    names = await service.get_distinct_field(db, "categoria")
    return {"total": len(names), "nombres": names}

@router.get("/municipios", response_model=NameListResponse)
async def read_municipalities(db = Depends(get_db_foursquare)):
    names = await service.get_distinct_field(db, "municipio")
    return {"total": len(names), "nombres": names}