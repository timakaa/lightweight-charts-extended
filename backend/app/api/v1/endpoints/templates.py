from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.repositories.template_repository import TemplateRepository
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

router = APIRouter()


class TemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100, description="Template name")
    theme_data: Dict[str, Any] = Field(description="Chart theme configuration")


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Template name")
    theme_data: Optional[Dict[str, Any]] = Field(None, description="Chart theme configuration")


@router.post("/templates")
def create_template(template_data: TemplateCreate, db: Session = Depends(get_db)):
    """Create a new chart theme template"""
    repo = TemplateRepository(db)
    
    try:
        template = repo.create(template_data.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "id": template.id,
        "name": template.name,
        "theme_data": template.theme_data,
        "created_at": template.created_at.isoformat(),
    }


@router.get("/templates")
def get_templates(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search term for template names"),
    db: Session = Depends(get_db),
):
    """Get all templates with pagination (excludes theme_data for performance)"""
    repo = TemplateRepository(db)
    templates, pagination = repo.get_all_paginated(page=page, page_size=page_size, search=search)
    
    return {
        "templates": [
            {
                "id": t.id,
                "name": t.name,
                "created_at": t.created_at.isoformat(),
            }
            for t in templates
        ],
        "pagination": pagination,
    }


@router.get("/templates/{template_id}")
def get_template(template_id: int, db: Session = Depends(get_db)):
    """Get a specific template by ID with full theme_data"""
    repo = TemplateRepository(db)
    template = repo.get_by_id(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {
        "id": template.id,
        "name": template.name,
        "theme_data": template.theme_data,
        "created_at": template.created_at.isoformat(),
        "updated_at": template.updated_at.isoformat(),
    }


@router.put("/templates/{template_id}")
def update_template(template_id: int, update_data: TemplateUpdate, db: Session = Depends(get_db)):
    """Update a template"""
    repo = TemplateRepository(db)
    
    # Filter out None values
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    try:
        template = repo.update(template_id, update_dict)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {
        "id": template.id,
        "name": template.name,
        "theme_data": template.theme_data,
        "updated_at": template.updated_at.isoformat(),
    }


@router.delete("/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    """Delete a template"""
    repo = TemplateRepository(db)
    
    if not repo.delete(template_id):
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template deleted successfully"}
