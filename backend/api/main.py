from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.data.database import engine, Base
from backend.api.routers.folder import router as folder_router
from backend.api.routers.file import router as file_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they do not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

    await engine.dispose()


app = FastAPI(
    lifespan=lifespan,
    title="File System API",
    description="Async API for large-scale browser-based file system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(folder_router, prefix="/api", tags=["Folders"])
app.include_router(file_router, prefix="/api", tags=["Files"])

@app.get("/health")
async def health_check():
    """Health check endpoint to verify the API is running."""
    return {"status": "ok", "message": "API is up and running"}
