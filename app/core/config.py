from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    """
    Define la configuración de la aplicación.
    Lee las variables desde un archivo .env y las valida.
    """
    model_config = SettingsConfigDict(env_file='.env', case_sensitive=True, extra='ignore')

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Dashboard Turismo API"
    
    MONGODB_URI: str
    MONGODB_DATABASE_FOURSQUARE: str
    MONGODB_DATABASE_GOOGLE: str
    REDIS_URL: str
    BACKEND_CORS_ORIGINS: List[str]


@lru_cache
def get_settings() -> Settings:
    """
    Crea y devuelve una instancia de la configuración.
    Usa @lru_cache para que el archivo .env se lea solo una vez.
    """
    return Settings()
