import uuid
import time
from typing import Optional


def generate_id(prefix: Optional[str] = "drawing") -> str:
    """Generate a unique ID with optional prefix"""
    timestamp = int(time.time() * 1000)  # Current time in milliseconds
    unique_id = str(uuid.uuid4())
    return f"{prefix}-{timestamp}-{unique_id}"
