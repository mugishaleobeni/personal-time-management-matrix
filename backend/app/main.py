from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import logging

from app.config import settings
from app.database import db_manager
from app.routers import (
    auth,
    tasks,
    routines,
    notes,
    analytics,
    notifications,
    system
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("chronos.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Chronos Backend Services...")
    await db_manager.connect()
    yield
    logger.info("Shutting down Chronos Backend Services...")
    await db_manager.close()

app = FastAPI(
    title="Master Your Time - Personal Productivity & Time Management API",
    description="Production-grade asynchronous backend powered by FastAPI, MongoDB Atlas, and JWT authentication.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(system.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(routines.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")

@app.get("/health", tags=["Root"])
@app.get("/api/health", tags=["Root"])
async def root_health():
    return {
        "status": "online",
        "service": "Master Your Time Backend",
        "database_status": db_manager.connection_status
    }

# Static frontend assets for production
dist_path = Path(__file__).resolve().parent.parent.parent / "dist"
if (dist_path / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(dist_path / "assets")), name="assets")

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_production_spa(full_path: str):
    # Don't intercept API routes or documentation
    if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        return {"error": "Not Found"}
    
    candidate = dist_path / full_path
    if candidate.is_file():
        return FileResponse(str(candidate))
    index_file = dist_path / "index.html"
    if index_file.is_file():
        return FileResponse(str(index_file))
    return {
        "status": "online",
        "service": "Master Your Time Backend",
        "database_status": db_manager.connection_status
    }
