from fastapi.middleware.cors import CORSMiddleware
from app.config import settings


def setup_cors(app):
    """Setup CORS middleware"""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
