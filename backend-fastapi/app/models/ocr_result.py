from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from app.core.database import Base
import datetime

class OCRResult(Base):
    __tablename__ = "ocr_results"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    upload_time = Column(DateTime, default=datetime.datetime.utcnow)
    raw_text = Column(Text)
    visits = Column(JSON)
    timeline = Column(JSON)
    monthly_summary = Column(JSON)
    errors = Column(JSON) 