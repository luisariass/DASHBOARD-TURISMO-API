from pydantic import BaseModel, Field
from typing import Optional, List

# --- Modelos Base ---
class SiteBase(BaseModel):
    id: str = Field(..., alias="_id")
    nombre: Optional[str] = None
    municipio: Optional[str] = None
    departamento: Optional[str] = None
    categoria: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None

# --- Modelos Específicos ---
class SiteFoursquare(SiteBase):
    rating: Optional[float] = None
    tips_count: Optional[int] = None

class SiteGoogle(SiteBase):
    puntuacion: Optional[float] = None
    num_resenas: Optional[int] = None

class Reviewer(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str = Field(..., alias="user_id")
    user_name: Optional[str] = Field(..., alias="nombre_usuario")
    municipio: Optional[str] = None
    departamento: Optional[str] = None

class TipDetails(BaseModel):
    """Representa la estructura de un objeto tip dentro del array en MongoDB."""
    tip_id: str
    site_id: Optional[str] = None
    date: Optional[str] = None
    reviewed_place: Optional[str] = None
    reviewed_category: Optional[str] = None
    comment: Optional[str] = None
    score: Optional[float] = None

class ExpandedTip(BaseModel):
    """Representa la estructura final de un tip expandido."""
    user_name: Optional[str] = None
    municipio: Optional[str] = None
    departamento: Optional[str] = None
    tip: TipDetails # El objeto 'tip' anidado

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
    tips: List[ExpandedTip]

class NameListResponse(BaseModel):
    total: int
    nombres: List[str]
