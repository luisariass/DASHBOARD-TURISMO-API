from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import get_settings
from app.core.database import db
from app.api.routers import foursquare, google

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db.connect()
    yield
    # Shutdown
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir Routers
app.include_router(foursquare.router, prefix="/foursquare", tags=["Foursquare"])
app.include_router(google.router, prefix="/google", tags=["Google"])

@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de Turismo v2"}