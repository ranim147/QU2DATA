from sqlalchemy import Boolean, Column, DateTime, String
from datetime import datetime
from database import Base


class ApiClient(Base):
    __tablename__ = "api_clients"

    id = Column(String, primary_key=True)
    api_key = Column(String, unique=True, nullable=False)
    api_secret_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)