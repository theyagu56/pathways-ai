from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Float
from app.core.database import Base
import datetime
import uuid

class MedicalChunk(Base):
    __tablename__ = "medical_chunks"

    id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, nullable=False, index=True)
    doc_type = Column(String, nullable=False)
    visit_date = Column(DateTime, nullable=True)
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_size = Column(Integer, nullable=False)
    embedding_model = Column(String, nullable=False)
    vector_store_type = Column(String, nullable=False)  # 'faiss' or 'azure'
    vector_id = Column(String, nullable=True)  # ID in vector store
    chunk_metadata = Column(JSON, nullable=True)  # Renamed from 'metadata' to avoid SQLAlchemy conflict
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow) 