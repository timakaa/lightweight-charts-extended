import uuid
from typing import Optional


def generate_id(prefix: Optional[str] = "drawing") -> str:
    """Generate a unique ID with optional prefix"""
    unique_id = str(uuid.uuid4())
    return f"{prefix}-{unique_id}"
