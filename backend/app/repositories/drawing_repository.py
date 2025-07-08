from sqlalchemy.orm import Session
from app.models.undelivered_drawings import UndeliveredDrawing
from typing import Optional, Union, List, Dict, Any


class DrawingRepository:
    def __init__(self, db: Session):
        self.db = db

    def store_undelivered_drawing(
        self,
        symbol: str,
        action: str,
        drawing_id: Optional[Union[str, List[str]]] = None,
        drawing_data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None,
    ) -> None:
        """Store undelivered drawing in database"""
        # Handle lists of drawings
        if isinstance(drawing_id, list) and isinstance(drawing_data, list):
            for id, data in zip(drawing_id, drawing_data):
                drawing = UndeliveredDrawing(
                    symbol=symbol,
                    drawing_id=id,
                    drawing_data=data,
                    action=action,
                )
                self.db.add(drawing)
        else:
            # Handle single drawing
            drawing = UndeliveredDrawing(
                symbol=symbol,
                drawing_id=drawing_id,
                drawing_data=drawing_data,
                action=action,
            )
            self.db.add(drawing)

        self.db.commit()

    def get_undelivered_drawings(self) -> List[UndeliveredDrawing]:
        """Get all undelivered drawings"""
        return self.db.query(UndeliveredDrawing).all()

    def remove_delivered_drawing(self, drawing_id: Union[str, List[str]]) -> None:
        """Remove drawing from undelivered list after successful delivery"""
        if isinstance(drawing_id, list):
            self.db.query(UndeliveredDrawing).filter(
                UndeliveredDrawing.drawing_id.in_(drawing_id),
            ).delete(synchronize_session=False)
        else:
            self.db.query(UndeliveredDrawing).filter(
                UndeliveredDrawing.drawing_id == drawing_id,
            ).delete(synchronize_session=False)

        self.db.commit()
