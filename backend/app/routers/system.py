from fastapi import APIRouter
from app.config import settings
from app.database import db_manager

router = APIRouter(prefix="/system", tags=["System Health & Diagnostics"])

@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "Chronos Productivity OS Backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

@router.get("/db-status")
async def database_status():
    return {
        "is_connected": db_manager.is_connected,
        "status": db_manager.connection_status,
        "database_name": settings.DATABASE_NAME,
        "has_mongodb_uri": settings.has_mongodb_uri
    }
