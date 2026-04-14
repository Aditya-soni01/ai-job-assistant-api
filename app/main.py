from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.routes import auth, ai, resumes
from app.routes import oauth
from app.models import resume as _resume_model  # noqa: F401 — ensures table is created
from app.models import password_reset as _password_reset_model  # noqa: F401 — ensures table is created

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager — handles startup/shutdown."""
    logger.info("Starting RoleGenie Resume Optimizer API...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
    logger.info("RoleGenie API started successfully")
    yield
    logger.info("Shutting down RoleGenie API...")


app = FastAPI(
    title=settings.app_name,
    description="AI-powered resume optimizer — Upload resume, paste JD, get optimized output",
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
app.include_router(ai.router, prefix="/api/ai", tags=["AI Services"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint — API health check."""
    return {
        "message": "RoleGenie Resume Optimizer API",
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
        description="RoleGenie Resume Optimizer API",
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
