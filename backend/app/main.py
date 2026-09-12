from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.db.session import engine, Base
import backend.app.models.models
from backend.app.api.v1 import auth, orders, reports, integrations

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permissive for easy dev across Next.js and API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(orders.router, prefix=f"{settings.API_V1_STR}/orders", tags=["Orders & Agents"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports & Analytics"])
app.include_router(integrations.router, prefix=f"{settings.API_V1_STR}/integrations", tags=["Integrations"])

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "DeliverIQ Backend",
        "version": settings.VERSION,
        "evolution_api_url": settings.EVOLUTION_API_URL
    }
