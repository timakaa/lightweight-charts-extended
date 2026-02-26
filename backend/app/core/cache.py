"""
Generic Redis cache manager for application-wide caching
"""
import json
import os
from typing import Optional, Any
import redis


class CacheManager:
    """Generic Redis cache manager (Singleton)"""

    _instance: Optional["CacheManager"] = None
    _redis_client: Optional[redis.Redis] = None

    def __new__(cls):
        """Singleton pattern to ensure one Redis connection"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize Redis connection (only once)"""
        # Only initialize if not already done
        if CacheManager._redis_client is None:
            CacheManager._redis_client = self._initialize_redis()

    def _initialize_redis(self) -> redis.Redis:
        """Initialize Redis connection"""
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

        try:
            redis_client = redis.from_url(
                redis_url, decode_responses=True, socket_connect_timeout=5
            )
            # Test connection
            redis_client.ping()
            print(f"✓ Connected to Redis cache at {redis_url}")
            return redis_client
        except Exception as e:
            print(f"✗ Redis connection failed: {e}")
            raise RuntimeError(
                f"Failed to connect to Redis at {redis_url}. "
                "Please ensure Redis is running and REDIS_URL is correct."
            )

    @property
    def redis(self) -> redis.Redis:
        """Get Redis client instance"""
        if CacheManager._redis_client is None:
            raise RuntimeError("Redis client not initialized")
        return CacheManager._redis_client

    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        try:
            value = self.redis.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            print(f"Redis get error for key '{key}': {e}")
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Set value in cache with optional TTL
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: Time to live in seconds (optional)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            serialized = json.dumps(value)
            if ttl:
                self.redis.setex(key, ttl, serialized)
            else:
                self.redis.set(key, serialized)
            return True
        except Exception as e:
            print(f"Redis set error for key '{key}': {e}")
            return False

    def delete(self, key: str) -> bool:
        """
        Delete key from cache
        
        Args:
            key: Cache key to delete
            
        Returns:
            True if key was deleted, False otherwise
        """
        try:
            return bool(self.redis.delete(key))
        except Exception as e:
            print(f"Redis delete error for key '{key}': {e}")
            return False

    def exists(self, key: str) -> bool:
        """
        Check if key exists in cache
        
        Args:
            key: Cache key to check
            
        Returns:
            True if key exists, False otherwise
        """
        try:
            return bool(self.redis.exists(key))
        except Exception as e:
            print(f"Redis exists error for key '{key}': {e}")
            return False

    def expire(self, key: str, ttl: int) -> bool:
        """
        Set expiration time for a key
        
        Args:
            key: Cache key
            ttl: Time to live in seconds
            
        Returns:
            True if successful, False otherwise
        """
        try:
            return bool(self.redis.expire(key, ttl))
        except Exception as e:
            print(f"Redis expire error for key '{key}': {e}")
            return False

    def keys(self, pattern: str = "*") -> list:
        """
        Get all keys matching pattern
        
        Args:
            pattern: Redis key pattern (e.g., "user:*")
            
        Returns:
            List of matching keys
        """
        try:
            return self.redis.keys(pattern)
        except Exception as e:
            print(f"Redis keys error for pattern '{pattern}': {e}")
            return []

    def flush_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern
        
        Args:
            pattern: Redis key pattern (e.g., "user:*")
            
        Returns:
            Number of keys deleted
        """
        try:
            keys = self.keys(pattern)
            if keys:
                return self.redis.delete(*keys)
            return 0
        except Exception as e:
            print(f"Redis flush_pattern error for pattern '{pattern}': {e}")
            return 0

    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """
        Increment a numeric value
        
        Args:
            key: Cache key
            amount: Amount to increment by (default: 1)
            
        Returns:
            New value after increment, or None on error
        """
        try:
            return self.redis.incrby(key, amount)
        except Exception as e:
            print(f"Redis increment error for key '{key}': {e}")
            return None

    def decrement(self, key: str, amount: int = 1) -> Optional[int]:
        """
        Decrement a numeric value
        
        Args:
            key: Cache key
            amount: Amount to decrement by (default: 1)
            
        Returns:
            New value after decrement, or None on error
        """
        try:
            return self.redis.decrby(key, amount)
        except Exception as e:
            print(f"Redis decrement error for key '{key}': {e}")
            return None


def get_cache() -> CacheManager:
    """
    Get the global cache instance (lazy initialization)
    
    This is the recommended way to access the cache.
    """
    return CacheManager()


# Global cache instance (for backward compatibility and convenience)
# This will be initialized on first access
cache = get_cache()
