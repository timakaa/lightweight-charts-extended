"""
ID generation utilities
"""
import uuid
import time
from typing import Optional


def generate_id(prefix: Optional[str] = "drawing") -> str:
    """
    Generate a unique ID with optional prefix
    
    Args:
        prefix: Optional prefix for the ID (default: "drawing")
        
    Returns:
        Unique ID string in format: {prefix}-{timestamp}-{uuid}
        
    Example:
        >>> generate_id("drawing")
        'drawing-1234567890123-a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    """
    timestamp = int(time.time() * 1000)  # Current time in milliseconds
    unique_id = str(uuid.uuid4())
    return f"{prefix}-{timestamp}-{unique_id}"
