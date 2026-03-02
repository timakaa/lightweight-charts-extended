from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.backtest_preset import BacktestPreset
from typing import Optional, List, Tuple


class PresetRepository:
    """Pure data access layer for backtest presets"""
    
    def __init__(self, db: Session):
        self.db = db

    def create(self, preset_data: dict) -> BacktestPreset:
        """Create a new preset"""
        preset = BacktestPreset(
            name=preset_data["name"],
            timeframe=preset_data["timeframe"],
            start_date=preset_data["start_date"],
            end_date=preset_data["end_date"],
        )
        
        self.db.add(preset)
        self.db.commit()
        self.db.refresh(preset)
        
        return preset

    def get_by_id(self, preset_id: int) -> Optional[BacktestPreset]:
        """Get preset by ID"""
        return self.db.query(BacktestPreset).filter(BacktestPreset.id == preset_id).first()

    def get_all_paginated(
        self, page: int = 1, page_size: int = 10, search: Optional[str] = None
    ) -> Tuple[List[BacktestPreset], dict]:
        """Get all presets with pagination and optional search"""
        query = self.db.query(BacktestPreset)
        
        # Apply search filter
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    BacktestPreset.name.ilike(search_filter),
                    BacktestPreset.timeframe.ilike(search_filter),
                )
            )
        
        # Order by most recent first
        query = query.order_by(BacktestPreset.created_at.desc())
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        presets = query.offset(offset).limit(page_size).all()
        
        # Calculate pagination info
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_prev = page > 1
        
        pagination = {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev,
        }
        
        return presets, pagination

    def update(self, preset_id: int, update_data: dict) -> Optional[BacktestPreset]:
        """Update a preset"""
        preset = self.get_by_id(preset_id)
        if not preset:
            return None
        
        for key, value in update_data.items():
            if hasattr(preset, key):
                setattr(preset, key, value)
        
        self.db.commit()
        self.db.refresh(preset)
        
        return preset

    def delete(self, preset_id: int) -> bool:
        """Delete a preset"""
        preset = self.get_by_id(preset_id)
        if not preset:
            return False
        
        self.db.delete(preset)
        self.db.commit()
        
        return True
