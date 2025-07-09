from sqlalchemy.orm import Session
from app.models.undelivered_drawings import UndeliveredDrawing
from typing import Optional, Union, List, Dict, Any, cast
from app.helpers.generate_id import generate_id


class DrawingRepository:
    def __init__(self, db: Session):
        self.db = db

    def store_undelivered_drawing(
        self,
        symbol: str,
        action: str,
        drawing_id: Optional[Union[str, List[str]]] = None,
        drawing_data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None,
    ) -> Union[UndeliveredDrawing, List[UndeliveredDrawing]]:
        """Store undelivered drawing in database and return the created drawing(s)"""
        # For create actions, generate an ID if not provided
        if action == "create":
            if isinstance(drawing_data, list):
                # Handle list of drawings
                for drawing in drawing_data:
                    if "type" in drawing and not drawing.get("id"):
                        generated_id = generate_id(drawing["type"])
                        drawing["id"] = generated_id
            elif (
                isinstance(drawing_data, dict)
                and "type" in drawing_data
                and not drawing_data.get("id")
            ):
                generated_id = generate_id(drawing_data["type"])
                drawing_data["id"] = generated_id

            # Update drawing_id to match the generated id
            if isinstance(drawing_data, list):
                drawing_id = [str(d.get("id")) for d in drawing_data if d.get("id")]
            else:
                drawing_id = (
                    str(drawing_data.get("id"))
                    if drawing_data and drawing_data.get("id")
                    else None
                )

        # Handle lists of drawings
        if isinstance(drawing_id, list) and isinstance(drawing_data, list):
            drawings = []
            for i, d_id in enumerate(drawing_id):
                # Ensure drawing data has the correct ID
                if i < len(drawing_data):
                    data = cast(Dict[str, Any], drawing_data[i])
                    if data:
                        data["id"] = d_id

                drawing = UndeliveredDrawing(
                    symbol=symbol,
                    drawing_id=d_id,
                    drawing_data=drawing_data[i] if i < len(drawing_data) else None,
                    action=action,
                )
                self.db.add(drawing)
                drawings.append(drawing)
            self.db.commit()
            return drawings
        else:
            # Ensure drawing data has the correct ID
            if drawing_data and drawing_id and isinstance(drawing_data, dict):
                drawing_data["id"] = drawing_id

            drawing = UndeliveredDrawing(
                symbol=symbol,
                drawing_id=drawing_id,
                drawing_data=drawing_data,
                action=action,
            )
            self.db.add(drawing)
            self.db.commit()
            return drawing

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
