from typing import List
from fastapi import APIRouter
from app.services.chart_service import chart_service
from app.models.undelivered_drawings import UndeliveredDrawing

router = APIRouter()


@router.get("/undelivered", response_model=List[dict])
async def get_undelivered_drawings() -> List[dict]:
    """Get all undelivered drawings"""
    drawings = chart_service.drawing_repository.get_undelivered_drawings()
    drawings_dict = [drawing.to_dict() for drawing in drawings] if drawings else []

    # Remove all fetched drawings since they will be delivered to client
    chart_service.drawing_repository.db.query(UndeliveredDrawing).delete(
        synchronize_session=False
    )
    chart_service.drawing_repository.db.commit()

    return drawings_dict
