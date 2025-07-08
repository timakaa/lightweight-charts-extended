from typing import Optional, List
from fastapi import APIRouter, Query
from app.services.chart_service import chart_service

router = APIRouter()


@router.get("/undelivered")
async def get_undelivered_drawings(
    client_sid: str = Query(..., description="Client socket ID"),
    symbol: Optional[str] = Query(
        None, description="Optional symbol to filter drawings"
    ),
) -> List[dict]:
    """Get undelivered drawings for a client, optionally filtered by symbol"""
    drawings = chart_service.drawing_repository.get_undelivered_drawings(
        client_sid, symbol
    )
    return [drawing.to_dict() for drawing in drawings]
