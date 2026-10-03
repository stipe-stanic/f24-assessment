import os
import logging
import asyncio

from dotenv import load_dotenv
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import text

from data.database import engine, Base
from api.routers.folder import router as folder_router
from api.routers.file import router as file_router


load_dotenv()

logging.basicConfig(level=logging.INFO)
logging.getLogger("sqlalchemy.engine").propagate = False
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    max_retries = 10
    retry_interval = 2

    for attempt in range(1, max_retries + 1):
        # Create tables if they do not exist
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables verified successfully")
            break
        except Exception as e:
            if attempt == max_retries:
                logger.critical(f"Failed to initialize database on startup: {e}")
                raise e
            logger.warning(
                f"Database system is still starting up"
                f" (attempt {attempt}/{max_retries}). Retrying in {retry_interval}s...")
            await asyncio.sleep(retry_interval)

    yield

    await engine.dispose()
    logger.info("Database engine connection poll closed.")


app = FastAPI(
    lifespan=lifespan,
    title="File System API",
    description="Async API for large-scale browser-based file system",
    version="1.0.0",
)

FRONTEND_URL = os.getenv("FRONTEND_URL")

if not FRONTEND_URL:
    raise RuntimeError("FRONTEND_URL environment variable is missing")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler for Database Constraint Violations (e.g. Duplicates)
@app.exception_handler(IntegrityError)
async def integrity_error(request: Request, exc: IntegrityError):
    logger.warning(f"Database integrity error on {request.url}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "An item with this name or configuration already exists in the folder."},
    )


# Global Catch-All Handler to prevent exposing raw stack traces
@app.exception_handler(Exception)
async def exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred."},
    )


app.include_router(folder_router, prefix="/api", tags=["Folders"])
app.include_router(file_router, prefix="/api", tags=["Files"])


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint to verify the API server and DB connectivity."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
        }
    except SQLAlchemyError as e:
        logger.error(f"Health check failed - Database unreachable: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "detail": "Database connection error.",
            },
        )
