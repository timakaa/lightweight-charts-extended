from typing import List
from fastapi import APIRouter
from app.services.chart_service import chart_service

router = APIRouter()


@router.get("/undelivered")
async def get_undelivered_drawings() -> List[dict]:
    """Get all undelivered drawings"""
    drawings = chart_service.drawing_repository.get_undelivered_drawings()
    return [drawing.to_dict() for drawing in drawings]
