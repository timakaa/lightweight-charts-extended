"""
Drawing Helper Functions
Pydantic models for creating type-safe drawings
"""
from typing import Dict, Any, Literal, Optional
from pydantic import BaseModel, Field


class LineStyle(BaseModel):
    """Style for line drawings"""
    color: str = Field(default="#00C851", description="Line color in hex or rgba")
    width: int = Field(default=1, ge=1, le=10, description="Line width")
    lineStyle: Literal["solid", "dashed", "dotted"] = Field(default="solid", description="Line style")


class RectangleStyle(BaseModel):
    """Style for rectangle drawings"""
    fillColor: str = Field(default="rgba(76, 175, 80, 0.3)", description="Fill color")
    borderColor: str = Field(default="rgba(76, 175, 80, 0.8)", description="Border color")
    borderWidth: int = Field(default=1, ge=0, le=10, description="Border width")


class LineDrawing(BaseModel):
    """Line drawing model"""
    type: Literal["line"] = "line"
    id: str = Field(..., description="Unique drawing ID")
    ticker: str = Field(..., description="Trading symbol")
    startTime: str = Field(..., description="Start time in ISO format")
    endTime: str = Field(..., description="End time in ISO format or 'relative'")
    startPrice: float = Field(..., description="Start price")
    endPrice: float = Field(..., description="End price")
    style: LineStyle = Field(default_factory=LineStyle)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return self.model_dump()


class RectangleDrawing(BaseModel):
    """Rectangle drawing model"""
    type: Literal["rectangle"] = "rectangle"
    id: str = Field(..., description="Unique drawing ID")
    ticker: str = Field(..., description="Trading symbol")
    startTime: str = Field(..., description="Start time in ISO format")
    endTime: str = Field(..., description="End time in ISO format or 'relative'")
    startPrice: float = Field(..., description="Bottom price")
    endPrice: float = Field(..., description="Top price")
    style: RectangleStyle = Field(default_factory=RectangleStyle)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return self.model_dump()


class LongPositionDrawing(BaseModel):
    """Long position drawing model"""
    type: Literal["long_position"] = "long_position"
    id: str = Field(..., description="Unique drawing ID")
    ticker: str = Field(..., description="Trading symbol")
    startTime: str = Field(..., description="Entry time")
    endTime: str = Field(..., description="Exit time")
    entryPrice: float = Field(..., description="Entry price")
    targetPrice: Optional[float] = Field(None, description="Take profit price")
    stopPrice: Optional[float] = Field(None, description="Stop loss price")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return self.model_dump()


class ShortPositionDrawing(BaseModel):
    """Short position drawing model"""
    type: Literal["short_position"] = "short_position"
    id: str = Field(..., description="Unique drawing ID")
    ticker: str = Field(..., description="Trading symbol")
    startTime: str = Field(..., description="Entry time")
    endTime: str = Field(..., description="Exit time")
    entryPrice: float = Field(..., description="Entry price")
    targetPrice: Optional[float] = Field(None, description="Take profit price")
    stopPrice: Optional[float] = Field(None, description="Stop loss price")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return self.model_dump()


# Helper functions for creating drawings
def create_horizontal_line(
    drawing_id: str,
    ticker: str,
    start_time: str,
    end_time: str,
    price: float,
    color: str = "#00C851",
    width: int = 1,
    line_style: Literal["solid", "dashed", "dotted"] = "solid"
) -> Dict[str, Any]:
    """Create a horizontal line drawing"""
    drawing = LineDrawing(
        id=drawing_id,
        ticker=ticker,
        startTime=start_time,
        endTime=end_time,
        startPrice=price,
        endPrice=price,
        style=LineStyle(color=color, width=width, lineStyle=line_style)
    )
    return drawing.to_dict()


def create_vertical_line(
    drawing_id: str,
    ticker: str,
    time: str,
    start_price: float,
    end_price: float,
    color: str = "#00C851",
    width: int = 1,
    line_style: Literal["solid", "dashed", "dotted"] = "dotted"
) -> Dict[str, Any]:
    """Create a vertical line drawing (for signals)"""
    drawing = LineDrawing(
        id=drawing_id,
        ticker=ticker,
        startTime=time,
        endTime=time,
        startPrice=start_price,
        endPrice=end_price,
        style=LineStyle(color=color, width=width, lineStyle=line_style)
    )
    return drawing.to_dict()


def create_rectangle(
    drawing_id: str,
    ticker: str,
    start_time: str,
    end_time: str,
    bottom_price: float,
    top_price: float,
    fill_color: str = "rgba(76, 175, 80, 0.3)",
    border_color: str = "rgba(76, 175, 80, 0.8)",
    border_width: int = 1
) -> Dict[str, Any]:
    """Create a rectangle drawing (for zones/gaps)"""
    drawing = RectangleDrawing(
        id=drawing_id,
        ticker=ticker,
        startTime=start_time,
        endTime=end_time,
        startPrice=bottom_price,
        endPrice=top_price,
        style=RectangleStyle(
            fillColor=fill_color,
            borderColor=border_color,
            borderWidth=border_width
        )
    )
    return drawing.to_dict()

