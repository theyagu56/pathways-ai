from sqlalchemy import Column, Integer, String, DateTime, Text
from app.core.database import Base
import datetime
import uuid

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, unique=True, index=True, default=lambda: f"PAT_{str(uuid.uuid4())[:8].upper()}")
    name = Column(String, nullable=False, index=True)
    folder_name = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String, nullable=True)
    insurance_info = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow) 