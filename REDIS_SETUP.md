# Redis Cache Setup

Redis is **required** for caching across the application.

## What's Cached

- **Ticker Data**: Market tickers from exchanges (60 second TTL)
- **Oldest Candle Data**: Historical candle timestamps (1 hour TTL)

## Setup

### With Docker Compose (Recommended)

Redis is automatically started with the application:

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up
```

### Local Development (Without Docker)

If running the backend locally without Docker:

1. Install Redis:

   ```bash
   # macOS
   brew install redis
   brew services start redis

   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis

   # Windows (WSL recommended)
   # Follow: https://redis.io/docs/getting-started/installation/install-redis-on-windows/
   ```

2. Set environment variable (optional, defaults to localhost):
   ```bash
   export REDIS_URL=redis://localhost:6379
   ```

## Configuration

Environment variables:

```env
# Redis connection URL (defaults to redis://localhost:6379)
REDIS_URL=redis://redis:6379

# Or with authentication
REDIS_URL=redis://:password@redis:6379

# Or with database selection
REDIS_URL=redis://redis:6379/0
```

## Monitoring

Check Redis status:

```bash
# Inside Docker
docker exec -it redis redis-cli ping
# Should return: PONG

# Check keys
docker exec -it redis redis-cli KEYS "exchange:*"

# Monitor commands in real-time
docker exec -it redis redis-cli MONITOR
```

## Benefits

- **Shared Cache**: Multiple backend instances share the same cache
- **Persistence**: Cache survives application restarts
- **Performance**: Fast in-memory data structure store
- **Scalability**: Easy to scale horizontally

## Cache Keys

The application uses these key patterns:

- `exchange:tickers` - All market tickers
- `exchange:oldest_candle:{symbol}:{timeframe}` - Oldest candle timestamps

## Troubleshooting

### Redis not connecting

1. Check if Redis container is running:

   ```bash
   docker ps | grep redis
   ```

2. Check Redis logs:

   ```bash
   docker logs redis
   ```

3. Verify network connectivity:
   ```bash
   docker exec backend ping redis
   ```

### Application won't start

If you see: `Failed to connect to Redis...`

- Ensure Redis is running
- Check `REDIS_URL` environment variable
- Verify network connectivity

### Clear cache manually

```bash
# Clear all exchange cache
docker exec -it redis redis-cli DEL "exchange:tickers"

# Clear all keys
docker exec -it redis redis-cli FLUSHALL
```
