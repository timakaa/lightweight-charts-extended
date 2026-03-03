from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.chart_theme_template import ChartThemeTemplate
from typing import Optional, List, Tuple


class TemplateRepository:
    """Pure data access layer for chart theme templates"""
    
    def __init__(self, db: Session):
        self.db = db

    def create(self, template_data: dict) -> ChartThemeTemplate:
        """Create a new template"""
        template = ChartThemeTemplate(
            name=template_data["name"],
            theme_data=template_data["theme_data"],
        )
        
        try:
            self.db.add(template)
            self.db.commit()
            self.db.refresh(template)
            return template
        except IntegrityError:
            self.db.rollback()
            raise ValueError(f"Template with name '{template_data['name']}' already exists")

    def get_by_id(self, template_id: int) -> Optional[ChartThemeTemplate]:
        """Get template by ID"""
        return self.db.query(ChartThemeTemplate).filter(ChartThemeTemplate.id == template_id).first()

    def get_by_name(self, name: str) -> Optional[ChartThemeTemplate]:
        """Get template by name"""
        return self.db.query(ChartThemeTemplate).filter(ChartThemeTemplate.name == name).first()

    def get_all_paginated(
        self, page: int = 1, page_size: int = 10, search: Optional[str] = None
    ) -> Tuple[List[ChartThemeTemplate], dict]:
        """Get all templates with pagination and optional search (excludes theme_data)"""
        query = self.db.query(ChartThemeTemplate)
        
        # Apply search filter
        if search:
            search_filter = f"%{search}%"
            query = query.filter(ChartThemeTemplate.name.ilike(search_filter))
        
        # Order by most recent first
        query = query.order_by(ChartThemeTemplate.created_at.desc())
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        templates = query.offset(offset).limit(page_size).all()
        
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
        
        return templates, pagination

    def update(self, template_id: int, update_data: dict) -> Optional[ChartThemeTemplate]:
        """Update a template"""
        template = self.get_by_id(template_id)
        if not template:
            return None
        
        # Check for name uniqueness if name is being updated
        if "name" in update_data and update_data["name"] != template.name:
            existing = self.get_by_name(update_data["name"])
            if existing:
                raise ValueError(f"Template with name '{update_data['name']}' already exists")
        
        for key, value in update_data.items():
            if hasattr(template, key):
                setattr(template, key, value)
        
        try:
            self.db.commit()
            self.db.refresh(template)
            return template
        except IntegrityError:
            self.db.rollback()
            raise ValueError(f"Template with name '{update_data.get('name')}' already exists")

    def delete(self, template_id: int) -> bool:
        """Delete a template"""
        template = self.get_by_id(template_id)
        if not template:
            return False
        
        self.db.delete(template)
        self.db.commit()
        
        return True
