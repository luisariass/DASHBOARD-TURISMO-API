from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Configuración del Modelo Pydantic
    # Le decimos que ignore las variables extra que encuentre en el .env
    model_config = SettingsConfigDict(env_file='../.env', case_sensitive=True, extra='ignore')

    # --- Variables de la API ---
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Dashboard Turismo API"
    
    # --- MongoDB ---
    # Nombres corregidos para coincidir con tu archivo .env
    MONGODB_URI: str
    MONGODB_DATABASE_FOURSQUARE: str = "foursquare_scraping"
    MONGODB_DATABASE_GOOGLE: str = "Googlemaps_Scraping"
    
    # --- CORS ---
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]


@lru_cache
def get_settings():
    return Settings()
