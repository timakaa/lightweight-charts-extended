# Pagination Utility Usage Guide

Reusable pagination utilities to avoid code duplication across services and repositories.

## Quick Start

```python
from app.utils.pagination import Paginator

# Simple pagination
items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
paginated_items, pagination_info = Paginator.paginate(items, page=1, page_size=3)

print(paginated_items)  # [1, 2, 3]
print(pagination_info.to_dict())
# {
#     "page": 1,
#     "page_size": 3,
#     "total_count": 10,
#     "total_pages": 4,
#     "has_next": True,
#     "has_prev": False
# }
```

## Complete Response

For API responses with filters:

```python
from app.utils.pagination import Paginator

users = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}, ...]

response = Paginator.create_response(
    items=users,
    page=1,
    page_size=10,
    filters={"search": "alice", "role": "admin"},
    items_key="users"  # Custom key name
)

# Returns:
# {
#     "users": [...],
#     "pagination": {...},
#     "filters": {"search": "alice", "role": "admin"}
# }
```

## Empty Response

For empty results:

```python
from app.utils.pagination import Paginator

response = Paginator.create_empty_response(
    page=1,
    page_size=10,
    filters={"search": "nonexistent"},
    items_key="products"
)

# Returns:
# {
#     "products": [],
#     "pagination": {
#         "page": 1,
#         "page_size": 10,
#         "total_count": 0,
#         "total_pages": 0,
#         "has_next": False,
#         "has_prev": False
#     },
#     "filters": {"search": "nonexistent"}
# }
```

## Using in Services

### Example: User Service

```python
from app.utils.pagination import Paginator

class UserService:
    def get_users(self, page: int = 1, page_size: int = 10, search: str = None):
        # Fetch all users from database
        query = self.db.query(User)

        if search:
            query = query.filter(User.name.ilike(f"%{search}%"))

        users = query.all()

        # Serialize users
        user_dicts = [user.to_dict() for user in users]

        # Create paginated response
        return Paginator.create_response(
            items=user_dicts,
            page=page,
            page_size=page_size,
            filters={"search": search},
            items_key="users"
        )
```

### Example: Product Service

```python
from app.utils.pagination import Paginator

class ProductService:
    def search_products(
        self,
        page: int = 1,
        page_size: int = 20,
        category: str = None,
        min_price: float = None,
        max_price: float = None
    ):
        products = self._fetch_products(category, min_price, max_price)

        if not products:
            return Paginator.create_empty_response(
                page=page,
                page_size=page_size,
                filters={
                    "category": category,
                    "min_price": min_price,
                    "max_price": max_price
                },
                items_key="products"
            )

        return Paginator.create_response(
            items=products,
            page=page,
            page_size=page_size,
            filters={
                "category": category,
                "min_price": min_price,
                "max_price": max_price
            },
            items_key="products"
        )
```

## Using in Repositories

### Example: Order Repository

```python
from app.utils.pagination import Paginator

class OrderRepository:
    def get_user_orders(self, user_id: int, page: int = 1, page_size: int = 10):
        orders = self.db.query(Order).filter(Order.user_id == user_id).all()

        order_dicts = [self._serialize_order(order) for order in orders]

        return Paginator.create_response(
            items=order_dicts,
            page=page,
            page_size=page_size,
            items_key="orders"
        )
```

## Advanced: Custom Pagination Logic

If you need custom pagination logic, use the base `paginate` function:

```python
from app.utils.pagination import Paginator

class CustomService:
    def get_items_with_custom_logic(self, page: int, page_size: int):
        # Fetch items
        items = self._fetch_items()

        # Apply custom filtering/sorting
        filtered_items = self._custom_filter(items)

        # Paginate
        paginated_items, pagination_info = Paginator.paginate(
            filtered_items, page, page_size
        )

        # Build custom response
        return {
            "data": paginated_items,
            "meta": pagination_info.to_dict(),
            "custom_field": "custom_value"
        }
```

## Type Safety

The pagination utility is fully typed:

```python
from typing import List
from app.utils.pagination import Paginator, PaginationInfo

def get_typed_items(items: List[dict]) -> tuple[List[dict], PaginationInfo]:
    return Paginator.paginate(items, page=1, page_size=10)
```

## Benefits

1. **DRY**: No more duplicated pagination logic
2. **Consistent**: Same pagination structure across all endpoints
3. **Type-safe**: Full type hints for better IDE support
4. **Flexible**: Works with any data type
5. **Testable**: Easy to unit test pagination logic

## Migration Guide

### Before (duplicated code):

```python
def get_items(page: int, page_size: int):
    items = fetch_items()
    total_count = len(items)
    total_pages = (total_count + page_size - 1) // page_size
    page = max(1, min(page, total_pages))
    start_idx = (page - 1) * page_size
    end_idx = min(start_idx + page_size, total_count)
    paginated = items[start_idx:end_idx]

    return {
        "items": paginated,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }
```

### After (using utility):

```python
from app.utils.pagination import Paginator

def get_items(page: int, page_size: int):
    items = fetch_items()
    return Paginator.create_response(items, page, page_size, items_key="items")
```

Much cleaner! 🎉
