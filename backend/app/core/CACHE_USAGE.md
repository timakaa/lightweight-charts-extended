# Cache Usage Guide

The application uses a centralized Redis cache manager that can be used across all services, repositories, and modules.

## Basic Usage

```python
from app.core.cache import cache

# Set a value with 60 second TTL
cache.set("user:123", {"name": "John", "email": "john@example.com"}, ttl=60)

# Get a value
user = cache.get("user:123")

# Delete a value
cache.delete("user:123")

# Check if key exists
if cache.exists("user:123"):
    print("User exists in cache")
```

## Advanced Operations

### Pattern-based operations

```python
# Get all keys matching pattern
user_keys = cache.keys("user:*")

# Delete all keys matching pattern
deleted_count = cache.flush_pattern("user:*")
```

### Counters

```python
# Increment a counter
cache.increment("page_views:home")
cache.increment("api_calls:today", amount=5)

# Decrement a counter
cache.decrement("items_in_stock:123")
```

### Expiration

```python
# Set expiration on existing key
cache.expire("session:abc", ttl=3600)
```

## Creating Service-Specific Cache Wrappers

For better organization, create a wrapper class for your service:

```python
# app/services/user/cache.py
from typing import Optional
from app.core.cache import cache


class UserCache:
    """User-specific cache operations"""

    USER_TTL = 300  # 5 minutes
    SESSION_TTL = 3600  # 1 hour

    @staticmethod
    def get_user(user_id: int) -> Optional[dict]:
        """Get cached user data"""
        return cache.get(f"user:{user_id}")

    @staticmethod
    def set_user(user_id: int, user_data: dict) -> bool:
        """Cache user data"""
        return cache.set(f"user:{user_id}", user_data, UserCache.USER_TTL)

    @staticmethod
    def delete_user(user_id: int) -> bool:
        """Remove user from cache"""
        return cache.delete(f"user:{user_id}")

    @staticmethod
    def get_session(session_id: str) -> Optional[dict]:
        """Get cached session"""
        return cache.get(f"session:{session_id}")

    @staticmethod
    def set_session(session_id: str, session_data: dict) -> bool:
        """Cache session data"""
        return cache.set(f"session:{session_id}", session_data, UserCache.SESSION_TTL)
```

Then use it in your service:

```python
# app/services/user_service.py
from .user.cache import UserCache

class UserService:
    def get_user(self, user_id: int):
        # Try cache first
        cached = UserCache.get_user(user_id)
        if cached:
            return cached

        # Fetch from database
        user = self.db.query(User).get(user_id)

        # Cache for next time
        UserCache.set_user(user_id, user.to_dict())

        return user
```

## Key Naming Conventions

Use consistent key patterns:

- `{service}:{entity}:{id}` - For specific entities
  - Example: `user:profile:123`, `order:details:456`
- `{service}:{collection}` - For collections
  - Example: `exchange:tickers`, `product:categories`
- `{service}:{entity}:{id}:{attribute}` - For specific attributes
  - Example: `user:123:preferences`, `order:456:status`

## Example: Exchange Cache

See `app/services/exchange/cache.py` for a real-world example:

```python
from app.core.cache import cache

class ExchangeCache:
    TICKER_TTL = 60
    TICKER_KEY = "exchange:tickers"

    @staticmethod
    def get_tickers() -> Optional[list]:
        return cache.get(ExchangeCache.TICKER_KEY)

    @staticmethod
    def set_tickers(tickers: list) -> bool:
        return cache.set(
            ExchangeCache.TICKER_KEY,
            tickers,
            ExchangeCache.TICKER_TTL
        )
```

## Best Practices

1. **Always use TTL**: Set appropriate expiration times to prevent stale data
2. **Use wrappers**: Create service-specific cache wrappers for better organization
3. **Consistent keys**: Follow naming conventions for easy debugging
4. **Handle failures**: Cache operations can fail, always have fallback logic
5. **Don't cache everything**: Only cache data that's expensive to compute/fetch
6. **Monitor usage**: Use Redis CLI to monitor cache hit rates and patterns

## Monitoring

```bash
# Check cache keys
docker exec -it redis redis-cli KEYS "*"

# Monitor cache operations in real-time
docker exec -it redis redis-cli MONITOR

# Get cache statistics
docker exec -it redis redis-cli INFO stats
```
