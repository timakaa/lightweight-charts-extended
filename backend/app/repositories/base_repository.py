from typing import Generic, TypeVar, Optional, List, Type
from sqlalchemy.orm import Session
from app.models.base_result import ResultBase

T = TypeVar("T", bound=ResultBase)


class BaseRepository(Generic[T]):
    """Generic repository for ResultBase subclasses (BacktestResult, TradingSession)"""

    model: Type[T]

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: int) -> Optional[T]:
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_all_paginated(
        self, page: int = 1, page_size: int = 10, search: Optional[str] = None
    ) -> tuple[List[T], dict]:
        query = self.db.query(self.model)

        if search:
            query = query.filter(self.model.title.ilike(f"%{search}%"))

        query = query.order_by(self.model.id.desc())
        total_count = query.count()

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        total_pages = (total_count + page_size - 1) // page_size
        pagination = {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }

        return items, pagination

    def update(self, id: int, update_data: dict) -> Optional[T]:
        item = self.db.query(self.model).filter(self.model.id == id).first()
        if not item:
            return None

        for field, value in update_data.items():
            if hasattr(item, field):
                setattr(item, field, value)

        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, id: int) -> bool:
        item = self.db.query(self.model).filter(self.model.id == id).first()
        if not item:
            return False
        self.db.delete(item)
        self.db.commit()
        return True

    def find_titles_like(self, base_title: str) -> List[str]:
        results = (
            self.db.query(self.model.title)
            .filter(self.model.title.like(f"{base_title}%"))
            .all()
        )
        return [t[0] for t in results]
