from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.routes import auth, jobs, ai, resumes
from app.routes import oauth
from app.models import resume as _resume_model  # noqa: F401 — ensures table is created
from app.services.seeder_service import SeederService
from app.core.database import get_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager — handles startup/shutdown."""
    logger.info("Starting AI Job Assistant API...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")

    db = next(get_db())
    try:
        SeederService.seed_jobs(db)
        logger.info("Database seeding completed")
    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
    finally:
        db.close()

    logger.info("AI Job Assistant API started successfully")
    yield
    logger.info("Shutting down AI Job Assistant API...")


app = FastAPI(
    title=settings.app_name,
    description="AI-powered job search assistant with resume optimization, cover letter generation, and job matching",
    version=settings.api_version,
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(oauth.router, prefix="/api/auth/oauth", tags=["OAuth"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Services"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint — API health check."""
    return {
        "message": "AI Job Assistant API",
        "version": settings.api_version,
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "api_version": settings.api_version,
        "debug": settings.debug,
    }


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=settings.app_name,
        version=settings.api_version,
        description="AI-powered job search assistant backend",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
