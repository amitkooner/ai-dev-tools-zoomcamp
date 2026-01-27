"""Main FastAPI application for NBA Predictions API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.db import init_db

# Create FastAPI application
app = FastAPI(
    title="NBA Game Predictions API",
    description="API for predicting NBA game outcomes and tracking accuracy",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "NBA Game Predictions API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }
