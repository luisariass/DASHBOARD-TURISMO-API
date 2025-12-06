from pydantic import BaseModel, Field
from typing import Optional, List, Any

# --- Modelos Genéricos ---
class SiteBase(BaseModel):
    id: str = Field(..., alias="_id")
    nombre: Optional[str] = None
    municipio: Optional[str] = None
    departamento: Optional[str] = None
    categoria: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None

class SiteFoursquare(SiteBase):
    rating: Optional[float] = None
    tips_count: Optional[int] = None

class SiteGoogle(SiteBase):
    puntuacion: Optional[float] = None
    num_resenas: Optional[int] = None

# --- Respuestas de Listas ---
class SiteListResponse(BaseModel):
    total: int
    sitios: List[SiteFoursquare]

class GoogleListResponse(BaseModel):
    total: int
    sitios: List[SiteGoogle]
    
class SiteGoogle(SiteBase):
    puntuacion: Optional[float] = None
    num_resenas: Optional[int] = None

class Reviewer(BaseModel):
    id: str = Field(..., alias="_id")
    nombre: Optional[str] = None
    municipio: Optional[str] = None
    departamento: Optional[str] = None
    
class Tip(BaseModel):
    id: str = Field(..., alias="_id")
    user_name: Optional[str] = None
    municipio: Optional[str] = None
    departamento: Optional[str] = None
    tip: Optional[str] = None

# --- Respuestas de Listas ---
class SiteListResponse(BaseModel):
    total: int
    sitios: List[SiteFoursquare]

class GoogleListResponse(BaseModel):
    total: int
    sitios: List[SiteGoogle]

class ReviewerListResponse(BaseModel):
    total: int
    reseñantes: List[Reviewer]

class TipListResponse(BaseModel):
    total_tips: int
    tips: List[Tip]

class NameListResponse(BaseModel):
    total: int
    nombres: List[str]