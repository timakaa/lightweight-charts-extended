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

- `GET /` - Root endpoint
- `GET /api/v1/health` - Health check
- `GET /docs` - API documentation (Swagger UI)

## Socket.IO Events

- `connect` - Client connection
- `disconnect` - Client disconnection
- `join_room` - Join a room
- `leave_room` - Leave a room
- `send_message` - Send message to room
- `chart_update` - Update chart data

## Environment Variables

- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8000)
- `DEBUG` - Debug mode (default: False)
- `SECRET_KEY` - Secret key for JWT tokens
- `SOCKET_CORS_ORIGINS` - CORS origins for Socket.IO
