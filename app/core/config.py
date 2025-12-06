from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Dashboard Turismo API"
    
    # MongoDB
    MONGODB_URI: str
    DB_FOURSQUARE: str = "foursquare_scraping"
    DB_GOOGLE: str = "Googlemaps_Scraping"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache
def get_settings():
    return Settings()