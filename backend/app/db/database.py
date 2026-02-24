from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

# Use mounted volume for database persistence
# Default to ./data for local development, /app/data in Docker
default_data_dir = "./data" if not os.path.exists("/app") else "/app/data"
data_dir = os.environ.get("DATA_DIR", default_data_dir)
os.makedirs(data_dir, exist_ok=True)
db_path = os.path.join(data_dir, "main.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
