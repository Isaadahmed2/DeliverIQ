import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "DeliverIQ API"
    VERSION: str = "1.0.0-MVP"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "deliveriq_super_secret_jwt_key_pakistan_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Existing Evolution API on host:8080
    EVOLUTION_API_URL: str = os.getenv("EVOLUTION_API_URL", "http://localhost:8080")
    EVOLUTION_API_KEY: str = os.getenv("EVOLUTION_API_KEY", "global_api_key")
    
    # OpenStreetMap Nominatim & Overpass
    OSM_NOMINATIM_URL: str = "https://nominatim.openstreetmap.org"
    OSM_OVERPASS_URL: str = "https://overpass-api.de/api/interpreter"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./deliveriq.db" # Default lightweight SQLite for rapid zero-friction MVP dev
    )
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3005",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3005"
    ]

    class Config:
        case_sensitive = True

settings = Settings()
