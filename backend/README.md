# Lightweight Charts Backend

FastAPI backend with Socket.IO for real-time trading chart functionality.

## Features

- FastAPI REST API
- Socket.IO for real-time communication
- CORS configuration
- Environment-based configuration
- Health check endpoint
- Backtest execution API
- Chart template management
- Drawing persistence and synchronization

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── health.py
│   │       │   ├── charts.py
│   │       │   ├── tickers.py
│   │       │   ├── backtests.py
│   │       │   └── templates.py
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

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

All REST API endpoints are documented there with interactive testing capabilities.

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
- `drawing` - New drawing created
- `drawing_updated` - Drawing modified
- `drawing_deleted` - Drawing removed

## Environment Variables

- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8000)
- `DEBUG` - Debug mode (default: False)
- `SECRET_KEY` - Secret key for JWT tokens
- `SOCKET_CORS_ORIGINS` - CORS origins for Socket.IO
