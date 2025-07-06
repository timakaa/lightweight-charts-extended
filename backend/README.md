# Moon Charts Backend

FastAPI backend with Socket.IO for real-time trading chart functionality.

## Features

- FastAPI REST API
- Socket.IO for real-time communication
- CORS configuration
- Environment-based configuration
- Health check endpoint

## Project Structure

```
moon-charts-backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   └── health.py
│   │       └── api.py
│   ├── core/
│   │   ├── cors.py
│   │   └── socket_manager.py
│   ├── config.py
│   └── main.py
├── requirements.txt
├── env.example
├── main.py
└── README.md
```

## Setup

1. Create virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy environment file:

```bash
cp env.example .env
```

4. Update `.env` with your configuration

## Running the Application

### Development

```bash
python main.py
```

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Charts

- `GET /api/v1/charts/{symbol}/candles` - Get candlestick data for a symbol
- `GET /api/v1/charts/test-drawing` - Test endpoint for single drawing
- `GET /api/v1/charts/test-multiple-drawings` - Test endpoint for multiple drawings
- `GET /api/v1/charts/test-drawing-delete` - Test endpoint for drawing deletion
- `GET /api/v1/charts/test-drawing-update` - Test endpoint for drawing update

### Tickers

- `GET /api/v1/tickers/` - Get default tickers
- `GET /api/v1/tickers/all` - Get all available tickers
- `GET /api/v1/tickers/{symbol}` - Get specific ticker information

### System

- `GET /` - Root endpoint
- `GET /api/v1/health` - Health check
- `GET /docs` - API documentation (Swagger UI)

## Socket.IO Events

### Client Events

- `connect` - Handles client connection, emits 'user_connected' with session ID
- `disconnect` - Handles client disconnection
- `join_room` - Join a specific room (format: {symbol}-{timeframe})
- `leave_room` - Leave a specific room

### Server Events

- `user_connected` - Emitted when a client connects
- `room_joined` - Emitted when a client joins a room
- `room_left` - Emitted when a client leaves a room
- `chart_data_updated` - Real-time chart data updates with new candles

## Environment Variables

- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8000)
- `DEBUG` - Debug mode (default: False)
- `SECRET_KEY` - Secret key for JWT tokens
- `SOCKET_CORS_ORIGINS` - CORS origins for Socket.IO
