import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import init_db, close_db
from app.routers import media

# Cargar .env desde el directorio backend
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown
    close_db()

app = FastAPI(
    title="Media to QR API",
    description="API minimalista para subir y servir archivos multimedia",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(media.router, prefix="/api/v1", tags=["media"])

@app.get("/")
async def root():
    return {
        "message": "Media to QR API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/api/v1/upload",
            "media": "/api/v1/media/{uuid}"
        }
    }

@app.get("/health")
async def health():
    return {"status": "ok"}
