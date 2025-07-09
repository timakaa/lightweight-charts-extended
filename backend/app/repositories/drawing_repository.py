from typing import Optional, Union, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.undelivered_drawings import UndeliveredDrawing


class DrawingRepository:
    def __init__(self, db: Session):
        self.db = db

    def store_undelivered_drawing(
        self,
        action: str,
        drawing_id: Optional[Union[str, List[str]]] = None,
        drawing_data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None,
    ):
        """Store undelivered drawing in database

        Args:
            action: Type of action - 'create', 'update', or 'delete'
            drawing_id: ID or list of IDs of the drawings
            drawing_data: Drawing data or list of drawing data

        Actions:
            - create: Stores new drawings with their data and symbol
            - update: Updates existing drawings with new data
            - delete: Marks drawings for deletion
        """
        # Convert single items to lists for consistent handling
        if isinstance(drawing_id, str):
            drawing_id = [drawing_id]
        if isinstance(drawing_data, dict):
            drawing_data = [drawing_data]

        # CREATE: Store new drawings with their data and symbol
        if action == "create" and drawing_data:
            # Store each drawing
            for data in drawing_data:
                if not data or "id" not in data:
                    continue
                drawing = UndeliveredDrawing(
                    drawing_id=str(data["id"]),
                    drawing_data=data,
                    action=action,
                )
                self.db.add(drawing)

        # UPDATE: Store updated data for existing drawings
        elif action == "update" and drawing_id and drawing_data:
            for id_, data in zip(drawing_id, drawing_data):
                drawing = UndeliveredDrawing(
                    drawing_id=str(id_),
                    drawing_data=data,
                    action=action,
                )
                self.db.add(drawing)

        # DELETE: Mark drawings for deletion
        elif action == "delete" and drawing_id:
            for id_ in drawing_id:
                drawing = UndeliveredDrawing(
                    drawing_id=str(id_),
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

    def remove_drawing_by_id(self, id: int) -> None:
        """Remove drawing by database ID"""
        self.db.query(UndeliveredDrawing).filter(UndeliveredDrawing.id == id).delete(
            synchronize_session=False
        )
        self.db.commit()
