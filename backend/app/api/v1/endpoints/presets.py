from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.repositories.preset_repository import PresetRepository
from typing import Optional
from pydantic import BaseModel, Field

router = APIRouter()


class PresetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100, description="Preset name")
    timeframe: str = Field(min_length=1, max_length=10, description="Timeframe (e.g., 1h, 4h, 1d)")
    start_date: str = Field(description="Start date in ISO format (YYYY-MM-DD)")
    end_date: str = Field(description="End date in ISO format (YYYY-MM-DD)")


class PresetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Preset name")
    timeframe: Optional[str] = Field(None, min_length=1, max_length=10, description="Timeframe")
    start_date: Optional[str] = Field(None, description="Start date in ISO format")
    end_date: Optional[str] = Field(None, description="End date in ISO format")


@router.post("/presets")
def create_preset(preset_data: PresetCreate, db: Session = Depends(get_db)):
    """Create a new backtest preset"""
    repo = PresetRepository(db)
    preset = repo.create(preset_data.model_dump())
    
    return {
        "id": preset.id,
        "name": preset.name,
        "timeframe": preset.timeframe,
        "start_date": preset.start_date,
        "end_date": preset.end_date,
        "created_at": preset.created_at.isoformat(),
    }


@router.get("/presets")
def get_presets(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search term for preset names"),
    db: Session = Depends(get_db),
):
    """Get all presets with pagination and search"""
    repo = PresetRepository(db)
    presets, pagination = repo.get_all_paginated(page=page, page_size=page_size, search=search)
    
    return {
        "presets": [
            {
                "id": p.id,
                "name": p.name,
                "timeframe": p.timeframe,
                "start_date": p.start_date,
                "end_date": p.end_date,
                "created_at": p.created_at.isoformat(),
            }
            for p in presets
        ],
        "pagination": pagination,
    }


@router.get("/presets/{preset_id}")
def get_preset(preset_id: int, db: Session = Depends(get_db)):
    """Get a specific preset by ID"""
    repo = PresetRepository(db)
    preset = repo.get_by_id(preset_id)
    
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    
    return {
        "id": preset.id,
        "name": preset.name,
        "timeframe": preset.timeframe,
        "start_date": preset.start_date,
        "end_date": preset.end_date,
        "created_at": preset.created_at.isoformat(),
        "updated_at": preset.updated_at.isoformat(),
    }


@router.patch("/presets/{preset_id}")
def update_preset(preset_id: int, update_data: PresetUpdate, db: Session = Depends(get_db)):
    """Update a preset"""
    repo = PresetRepository(db)
    
    # Filter out None values
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    preset = repo.update(preset_id, update_dict)
    
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    
    return {
        "id": preset.id,
        "name": preset.name,
        "timeframe": preset.timeframe,
        "start_date": preset.start_date,
        "end_date": preset.end_date,
        "updated_at": preset.updated_at.isoformat(),
    }


@router.delete("/presets/{preset_id}")
def delete_preset(preset_id: int, db: Session = Depends(get_db)):
    """Delete a preset"""
    repo = PresetRepository(db)
    
    if not repo.delete(preset_id):
        raise HTTPException(status_code=404, detail="Preset not found")
    
    return {"message": "Preset deleted successfully"}
