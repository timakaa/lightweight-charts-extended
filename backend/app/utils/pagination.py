"""
Reusable pagination utilities
"""
from typing import List, Dict, Any, TypeVar, Generic, Optional
from dataclasses import dataclass

T = TypeVar("T")


@dataclass
class PaginationInfo:
    """Pagination metadata"""

    page: int
    page_size: int
    total_count: int
    total_pages: int
    has_next: bool
    has_prev: bool

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "page": self.page,
            "page_size": self.page_size,
            "total_count": self.total_count,
            "total_pages": self.total_pages,
            "has_next": self.has_next,
            "has_prev": self.has_prev,
        }


@dataclass
class PaginatedResponse(Generic[T]):
    """Generic paginated response"""

    items: List[T]
    pagination: PaginationInfo
    filters: Optional[Dict[str, Any]] = None

    def to_dict(self, items_key: str = "items") -> Dict[str, Any]:
        """
        Convert to dictionary
        
        Args:
            items_key: Key name for items in response (default: "items")
        """
        response = {
            items_key: self.items,
            "pagination": self.pagination.to_dict(),
        }
        if self.filters is not None:
            response["filters"] = self.filters
        return response


class Paginator:
    """Utility class for pagination operations"""

    @staticmethod
    def paginate(
        items: List[T], page: int = 1, page_size: int = 10
    ) -> tuple[List[T], PaginationInfo]:
        """
        Paginate a list of items
        
        Args:
            items: List of items to paginate
            page: Page number (1-indexed)
            page_size: Number of items per page
            
        Returns:
            Tuple of (paginated_items, pagination_info)
        """
        total_count = len(items)
        total_pages = max(1, (total_count + page_size - 1) // page_size)

        # Ensure page is within valid range
        page = max(1, min(page, total_pages))

        # Calculate slice indices
        start_idx = (page - 1) * page_size
        end_idx = min(start_idx + page_size, total_count)

        # Get paginated items
        paginated_items = items[start_idx:end_idx]

        # Create pagination info
        pagination_info = PaginationInfo(
            page=page,
            page_size=page_size,
            total_count=total_count,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

        return paginated_items, pagination_info

    @staticmethod
    def create_response(
        items: List[T],
        page: int = 1,
        page_size: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        items_key: str = "items",
    ) -> Dict[str, Any]:
        """
        Create a complete paginated response
        
        Args:
            items: List of items to paginate
            page: Page number (1-indexed)
            page_size: Number of items per page
            filters: Optional filter parameters to include in response
            items_key: Key name for items in response (default: "items")
            
        Returns:
            Dictionary with paginated items, pagination info, and filters
        """
        paginated_items, pagination_info = Paginator.paginate(items, page, page_size)

        response = PaginatedResponse(
            items=paginated_items, pagination=pagination_info, filters=filters
        )

        return response.to_dict(items_key=items_key)

    @staticmethod
    def create_empty_response(
        page: int = 1,
        page_size: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        items_key: str = "items",
    ) -> Dict[str, Any]:
        """
        Create an empty paginated response
        
        Args:
            page: Page number
            page_size: Number of items per page
            filters: Optional filter parameters
            items_key: Key name for items in response
            
        Returns:
            Dictionary with empty items and pagination info
        """
        pagination_info = PaginationInfo(
            page=page,
            page_size=page_size,
            total_count=0,
            total_pages=0,
            has_next=False,
            has_prev=False,
        )

        response = PaginatedResponse(items=[], pagination=pagination_info, filters=filters)

        return response.to_dict(items_key=items_key)


# Convenience function for quick pagination
def paginate(
    items: List[T], page: int = 1, page_size: int = 10
) -> tuple[List[T], PaginationInfo]:
    """
    Quick pagination function
    
    Args:
        items: List of items to paginate
        page: Page number (1-indexed)
        page_size: Number of items per page
        
    Returns:
        Tuple of (paginated_items, pagination_info)
    """
    return Paginator.paginate(items, page, page_size)
