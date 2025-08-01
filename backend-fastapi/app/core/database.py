import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Import models to ensure they are registered
from app.models.ocr_result import OCRResult

# Create tables
def create_tables():
    try:
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # Verify table exists
        with engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='ocr_results'"))
            if result.fetchone():
                logger.info("✅ ocr_results table created successfully")
            else:
                logger.error("❌ ocr_results table was not created")
                
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")

# Create tables on import
create_tables() 